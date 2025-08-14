// migrate-data.js
import { PrismaClient as GlobalPrismaClient } from './prisma/generated/global-client/index.js';
import { PrismaClient as RegionPrismaClient } from './prisma/generated/region-client/index.js';

// 正式数据库连接
const prodGlobalClient = new GlobalPrismaClient({
  datasources: {
    db: {
      url: process.env.PROD_GLOBAL || "postgresql://sealos:fb9jg8te4x78ocqrr2vgbs99qauh9flfd1u6g300kq7ywjay3ah7cndr60udd6wg@192.168.10.35:32749/global2"
    }
  }
});

const prodRegionClient = new RegionPrismaClient({
  datasources: {
    db: {
      url: process.env.PROD_REGION || "postgresql://sealos:fb9jg8te4x78ocqrr2vgbs99qauh9flfd1u6g300kq7ywjay3ah7cndr60udd6wg@192.168.10.35:32749/local"
    }
  }
});

// 测试数据库连接
const testGlobalClient = new GlobalPrismaClient({
  datasources: {
    db: {
      url: process.env.TEST_GLOBAL || "postgresql://sealos:fb9jg8te4x78ocqrr2vgbs99qauh9flfd1u6g300kq7ywjay3ah7cndr60udd6wg@192.168.10.35:32749/hlj-dev-global"
    }
  }
});

const testRegionClient = new RegionPrismaClient({
  datasources: {
    db: {
      url: process.env.TEST_REGION || "postgresql://sealos:fb9jg8te4x78ocqrr2vgbs99qauh9flfd1u6g300kq7ywjay3ah7cndr60udd6wg@192.168.10.35:32749/hlj-dev-local"
    }
  }
});

// 获取所有模型名称的辅助函数
function getModelNames(prismaClient) {
  return Object.keys(prismaClient).filter(key => 
    typeof prismaClient[key] === 'object' && 
    prismaClient[key].findMany &&
    !key.startsWith('$')
  );
}

async function migrateTable(sourceClient, targetClient, tableName) {
  console.log(`开始迁移表: ${tableName}`);
  
  try {
    // 获取源数据
    const data = await sourceClient[tableName].findMany();
    console.log(`  - 找到 ${data.length} 条记录`);
    
    if (data.length === 0) {
      console.log(`  - 跳过空表: ${tableName}`);
      return;
    }
    
    // 清空目标表
    await targetClient[tableName].deleteMany();
    console.log(`  - 清空目标表`);
    
    // 批量插入数据
    let successCount = 0;
    for (const record of data) {
      try {
        await targetClient[tableName].create({
          data: record
        });
        successCount++;
      } catch (error) {
        console.error(`  - 插入记录失败:`, error.message);
        console.error(`  - 记录数据:`, JSON.stringify(record, null, 2));
      }
    }
    
    console.log(`  - 成功迁移 ${successCount}/${data.length} 条记录`);
  } catch (error) {
    console.error(`  - 迁移表 ${tableName} 失败:`, error.message);
  }
}

async function migrateGlobalData() {
  console.log('🌐 开始迁移全局数据库...');
  
  try {
    const modelNames = getModelNames(prodGlobalClient);
    console.log(`发现模型: ${modelNames.join(', ')}`);
    
    for (const modelName of modelNames) {
      await migrateTable(prodGlobalClient, testGlobalClient, modelName);
    }
    
    console.log('✅ 全局数据库迁移完成！');
  } catch (error) {
    console.error('❌ 全局数据库迁移失败:', error);
  }
}

async function migrateRegionData() {
  console.log('🏢 开始迁移区域数据库...');
  
  try {
    const modelNames = getModelNames(prodRegionClient);
    console.log(`发现模型: ${modelNames.join(', ')}`);
    
    for (const modelName of modelNames) {
      await migrateTable(prodRegionClient, testRegionClient, modelName);
    }
    
    console.log('✅ 区域数据库迁移完成！');
  } catch (error) {
    console.error('❌ 区域数据库迁移失败:', error);
  }
}

async function main() {
  console.log('🚀 开始数据迁移...');
  
  try {
    await migrateGlobalData();
    await migrateRegionData();
    console.log('🎉 所有数据迁移完成！');
  } catch (error) {
    console.error('💥 迁移过程中出错:', error);
  } finally {
    // 关闭连接
    await prodGlobalClient.$disconnect();
    await prodRegionClient.$disconnect();
    await testGlobalClient.$disconnect();
    await testRegionClient.$disconnect();
  }
}

main().catch(console.error);
