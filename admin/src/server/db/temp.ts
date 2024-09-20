import jwt from "jsonwebtoken";
import { globalPrisma, regionPrisma } from "~/server/db/init";

const TOKEN_SECRET = 'aaaaa';

// getUser. get id, uid, nickname, realName, phone, email, balance, deductionBalance.
export async function getUser(id: string) {
    // get user
    const user = await globalPrisma.user.findUnique({
        where: {
            id: id
        }
    });

    if (!user) {
        throw new Error(`User with id ${id} not found`);
    }

    //get account
    const account = await globalPrisma.account.findUnique({
        where: {
            userUid: id
        }
    });

    // get userRealNameInfo
    const userRealNameInfo = await globalPrisma.userRealNameInfo.findUnique({
        where: {
            userUid: id
        }
    });

    // get oauthProvider
    const oauthProvider = await globalPrisma.oauthProvider.findMany({
        where: {
            userUid: id,
            providerType: 'EMAIL'
        }
    });

    // get token
    const token = await generateToken(id);

    return {
        id: user.id,
        uid: user.uid,
        nickname: user.nickname,
        realName: userRealNameInfo?.realName ?? null,
        phone: userRealNameInfo?.phone ?? null,
        email: oauthProvider[0]?.providerId ?? null,
        balance: account?.balance ?? 0,
        deductionBalance: account?.deduction_balance ?? 0,
        token: token
    };
}

// getUserList(include uid, id, nickname, balance, realName, idCard, phone)
export async function getUserList() {
    const users = await globalPrisma.user.findMany();

    const uids = users.map((user) => user.uid);

    // todo uids.forEach()

    const accounts = await globalPrisma.account.findMany({
        where: {
            userUid: {
                in: uids
            }
        }
    });


    const realNameInfos = await globalPrisma.userRealNameInfo.findMany({
        where: {
            userUid: {
                in: uids
            }
        }
    });

    const accountMap = accounts.reduce((map: Record<string, any>, account) => {
        map[account.userUid] = account;
        return map;
    }, {});

    const realNameInfoMap = realNameInfos.reduce((map: Record<string, any>, info) => {
        map[info.userUid] = info;
        return map;
    }, {});

    return users.map((user) => {
        const account = accountMap[user.uid] || {};
        const realNameInfo = realNameInfoMap[user.uid] || {};

        return {
            uid: user.uid,
            id: user.id,
            nickname: user.nickname,
            deductionBalance: account.deduction_balance || null,
            realName: realNameInfo.realName || null,
            idCard: realNameInfo.idCard || null,
            phone: realNameInfo.phone || null
        };
    });
}

export async function generateToken(id: string) {
    try {
        // 查找用户
        const user = await globalPrisma.user.findMany({
            where: {
                id: id
            }
        });

        // 检查用户是否存在
        if (!user) {
            console.error('User is null.');
            return null;
        }

        // 检查用户 UID 的长度
        if (user.length === 0) {
            console.error('No user found with the given id.');
            return null;
        }
        if (user.length > 1) {
            console.error('Multiple users found with the given id.');
            return null;
        }

        // 构建负载
        // @ts-ignore
        const uid = user[0].uid;
        const payload = {
            userId: id,
            userUid: uid
        };

        // 返回生成的 JWT
        return jwt.sign(payload, TOKEN_SECRET, { expiresIn: '3h' });
    } catch (error) {
        console.error('Error generating token:', error);
        return null;
    }
}

export async function main() {
console.log('start');
}

main()
    .then(async () => {
        await globalPrisma.$disconnect();
        await regionPrisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await globalPrisma.$disconnect();
        await regionPrisma.$disconnect();
        process.exit(1);
    });
