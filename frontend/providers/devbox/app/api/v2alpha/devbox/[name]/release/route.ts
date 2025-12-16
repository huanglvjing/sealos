import { NextRequest, NextResponse } from 'next/server';
import { authSession } from '@/services/backend/auth';
import { getK8s } from '@/services/backend/kubernetes';
import { jsonRes } from '@/services/backend/response';
import { KBDevboxReleaseType, KBDevboxTypeV2 } from '@/types/k8s';
import { json2DevboxRelease } from '@/utils/json2Yaml';
import { adaptDevboxVersionListItem } from '@/utils/adapt';
import { RequestSchema } from './schema';
import { devboxKey, DevboxReleaseStatusEnum } from '@/constants/devbox';

export const dynamic = 'force-dynamic';

const DEVBOX_NAME_PATTERN = /^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/;
const MAX_DEVBOX_NAME_LENGTH = 63;
const PATCH_OPTIONS = { headers: { 'Content-Type': 'application/merge-patch+json' } };
const DEVBOX_API = {
  group: 'devbox.sealos.io',
  version: 'v1alpha2',
  devboxes: 'devboxes',
  releases: 'devboxreleases'
} as const;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function validateDevboxName(name: string): boolean {
  return DEVBOX_NAME_PATTERN.test(name) && name.length <= MAX_DEVBOX_NAME_LENGTH;
}

async function listIngresses(k8sNetworkingApp: any, namespace: string, devboxName: string) {
  const { body } = await k8sNetworkingApp.listNamespacedIngress(
    namespace, undefined, undefined, undefined, undefined, `${devboxKey}=${devboxName}`
  );
  return (body as { items: any[] }).items || [];
}

async function listDevboxReleases(k8sCustomObjects: any, namespace: string) {
  const { body } = await k8sCustomObjects.listNamespacedCustomObject(
    DEVBOX_API.group, DEVBOX_API.version, namespace, DEVBOX_API.releases
  ) as { body: { items: KBDevboxReleaseType[] } };
  return body.items || [];
}

async function listDevboxes(k8sCustomObjects: any, namespace: string) {
  const { body } = await k8sCustomObjects.listNamespacedCustomObject(
    DEVBOX_API.group, DEVBOX_API.version, namespace, DEVBOX_API.devboxes
  ) as { body: { items: KBDevboxTypeV2[] } };
  return body.items || [];
}

async function patchIngresses(
  k8sNetworkingApp: any,
  namespace: string,
  ingresses: any[],
  fromClass: string,
  toClass: string
) {
  await Promise.all(
    ingresses.map((ingress) => {
      const { name } = ingress.metadata;
      const ann = ingress.metadata?.annotations?.['kubernetes.io/ingress.class'];
      const spec = ingress.spec?.ingressClassName;

      if (ann === fromClass) {
        return k8sNetworkingApp.patchNamespacedIngress(
          name, namespace,
          { metadata: { annotations: { 'kubernetes.io/ingress.class': toClass } } },
          undefined, undefined, undefined, undefined, undefined, PATCH_OPTIONS
        );
      }
      if (spec === fromClass) {
        return k8sNetworkingApp.patchNamespacedIngress(
          name, namespace,
          { spec: { ingressClassName: toClass } },
          undefined, undefined, undefined, undefined, undefined, PATCH_OPTIONS
        );
      }
      return Promise.resolve();
    })
  );
}

async function setDevboxState(
  k8sNetworkingApp: any,
  k8sCustomObjects: any,
  namespace: string,
  devboxName: string,
  running: boolean
) {
  const ingresses = await listIngresses(k8sNetworkingApp, namespace, devboxName);
  const [fromClass, toClass] = running ? ['pause', 'nginx'] : ['nginx', 'pause'];

  const targetIngresses = running
    ? ingresses
    : ingresses.filter((ing) => {
        const ann = ing.metadata?.annotations?.['kubernetes.io/ingress.class'];
        const spec = ing.spec?.ingressClassName;
        return ann === 'nginx' || spec === 'nginx';
      });

  await patchIngresses(k8sNetworkingApp, namespace, targetIngresses, fromClass, toClass);
  await k8sCustomObjects.patchNamespacedCustomObject(
    DEVBOX_API.group, DEVBOX_API.version, namespace, DEVBOX_API.devboxes, devboxName,
    { spec: { state: running ? 'Running' : 'Stopped' } },
    undefined, undefined, undefined, PATCH_OPTIONS
  );
}

async function executeReleaseTask(params: {
  applyYamlList: any;
  k8sCustomObjects: any;
  k8sNetworkingApp: any;
  namespace: string;
  devboxName: string;
  devboxUid: string;
  tag: string;
  releaseDes: string;
  wasRunning: boolean;
  shouldRestart: boolean;
}) {
  const {
    applyYamlList, k8sCustomObjects, k8sNetworkingApp,
    namespace, devboxName, devboxUid, tag, releaseDes,
    wasRunning, shouldRestart
  } = params;
  await setDevboxState(k8sNetworkingApp, k8sCustomObjects, namespace, devboxName, false);

  try {
    const devboxYaml = json2DevboxRelease({
      devboxName,
      tag,
      releaseDes,
      devboxUid,
      startDevboxAfterRelease: false
    });
    await applyYamlList([devboxYaml], 'create');

    for (let retry = 0; retry < 200; retry++) {
      const releases = await listDevboxReleases(k8sCustomObjects, namespace);
      const release = releases.find((item) => {
        if (item?.spec?.devboxName !== devboxName || item?.spec?.version !== tag) return false;
        const ownerUid = item?.metadata?.ownerReferences?.[0]?.uid;
        return !devboxUid || !ownerUid || ownerUid === devboxUid;
      });

      if (release?.status?.phase === DevboxReleaseStatusEnum.Success) {
        if (shouldRestart) {
          await setDevboxState(k8sNetworkingApp, k8sCustomObjects, namespace, devboxName, true);
        }
        return;
      }
      if (release?.status?.phase === DevboxReleaseStatusEnum.Failed) {
        throw new Error('Devbox release failed');
      }
      await sleep(3000);
    }
    throw new Error('Devbox release timeout');
  } catch (e) {
    if (wasRunning) {
      try {
        await setDevboxState(k8sNetworkingApp, k8sCustomObjects, namespace, devboxName, true);
      } catch {}
    }
    console.error('[ReleaseTask Error]', devboxName, tag, e);
  }
}

export async function GET(req: NextRequest, { params }: { params: { name: string } }) {
  try {
    const { name: devboxName } = params;

    if (!validateDevboxName(devboxName)) {
      return jsonRes({ code: 400, message: 'Invalid devbox name format' });
    }

    const { k8sCustomObjects, namespace } = await getK8s({
      kubeconfig: await authSession(req.headers)
    });

    const devboxes = await listDevboxes(k8sCustomObjects, namespace);
    if (!devboxes.some((item) => item?.metadata?.name === devboxName)) {
      return jsonRes({ code: 404, message: 'Devbox not found' });
    }

    const releases = await listDevboxReleases(k8sCustomObjects, namespace);
    const { REGISTRY_ADDR } = process.env;

    const versions = releases
      .filter((item) => item.spec?.devboxName === devboxName)
      .map(adaptDevboxVersionListItem)
      .sort((a, b) => new Date(b.createTime).getTime() - new Date(a.createTime).getTime())
      .map(({ createTime, ...rest }) => ({
        ...rest,
        createdAt: createTime,
        image: `${REGISTRY_ADDR}/${namespace}/${rest.devboxName}:${rest.tag}`
      }));

    return NextResponse.json(versions);
  } catch (err: any) {
    return jsonRes({ code: 500, message: err?.message || 'Internal server error', error: err });
  }
}

export async function POST(req: NextRequest, { params }: { params: { name: string } }) {
  try {
    const body = await req.json();
    const validationResult = RequestSchema.safeParse(body);

    if (!validationResult.success) {
      return jsonRes({ code: 400, message: 'Invalid request body', error: validationResult.error.errors });
    }

    const releaseForm = validationResult.data;
    const { name: devboxName } = params;

    if (!validateDevboxName(devboxName)) {
      return jsonRes({ code: 400, message: 'Invalid devbox name format' });
    }

    const { applyYamlList, namespace, k8sCustomObjects, k8sNetworkingApp } = await getK8s({
      kubeconfig: await authSession(req.headers)
    });

    const [releases, devboxes] = await Promise.all([
      listDevboxReleases(k8sCustomObjects, namespace),
      listDevboxes(k8sCustomObjects, namespace)
    ]);

    const devbox = devboxes.find((item) => item.metadata?.name === devboxName);
    if (!devbox) {
      return jsonRes({ code: 404, message: 'Devbox not found' });
    }

    const tagExists = releases.some(
      (item) => item.spec?.devboxName === devboxName && item.spec?.version === releaseForm.tag
    );
    if (tagExists) {
      return jsonRes({ code: 409, message: 'Devbox release already exists' });
    }

    const wasRunning = devbox?.spec?.state === 'Running';

    executeReleaseTask({
      applyYamlList,
      k8sCustomObjects,
      k8sNetworkingApp,
      namespace,
      devboxName,
      devboxUid: devbox?.metadata?.uid || '',
      tag: releaseForm.tag,
      releaseDes: releaseForm.releaseDes,
      wasRunning,
      shouldRestart: wasRunning || releaseForm.startDevboxAfterRelease
    }).catch((err) => console.error('[ReleaseTask Unhandled]', err));

    return new NextResponse(null, { status: 202 });
  } catch (err: any) {
    return jsonRes({ code: 500, message: err?.message || 'Internal server error', error: err });
  }
}