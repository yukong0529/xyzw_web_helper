/**
 * 诊断 __require 模块加载器
 * 在游戏控制台中运行此脚本，找出正确的模块名
 */

(function() {
  console.log('=== __require 模块诊断工具 ===\n');

  // 1. 检查 __require 是否存在
  console.log('1. 检查 __require:');
  console.log('   window.__require 类型:', typeof window.__require);

  if (typeof window.__require !== 'function') {
    console.error('   ❌ window.__require 不存在或不是函数');
    console.log('   请确保游戏已加载完成');
    return;
  }

  console.log('   ✅ window.__require 存在\n');

  // 2. 测试不同的模块名
  console.log('2. 测试模块名:');

  const moduleNames = [
    'bon',
    '@o4e/bon',
    '@o4e/bon/index',
    'bon/index',
    'data-index',
    'LoginService',
    'GameState',
    'LoginManager'
  ];

  const results = {};

  moduleNames.forEach(name => {
    try {
      const mod = window.__require(name);
      const type = typeof mod;
      const keys = mod && typeof mod === 'object' ? Object.keys(mod).slice(0, 10) : [];

      results[name] = { type, keys, exists: !!mod };

      console.log(`   ${name}:`);
      console.log(`     类型: ${type}`);
      if (keys.length > 0) {
        console.log(`     方法: ${keys.join(', ')}`);
      }
      console.log('');
    } catch (e) {
      results[name] = { error: e.message };
      console.log(`   ${name}: ❌ 错误 - ${e.message}\n`);
    }
  });

  // 3. 检查 bon 模块的具体 API
  console.log('3. 检查 bon 模块 API:');

  // 尝试找到 bon 模块
  let bon = null;
  let bonName = null;

  for (const name of ['bon', '@o4e/bon', '@o4e/bon/index']) {
    try {
      bon = window.__require(name);
      if (bon) {
        bonName = name;
        break;
      }
    } catch (e) {}
  }

  if (bon) {
    console.log(`   ✅ 找到 bon 模块 (使用 "${bonName}")\n`);

    console.log('   完整 API:');
    const allKeys = Object.keys(bon);
    allKeys.forEach(key => {
      const val = bon[key];
      const type = typeof val;
      console.log(`     ${key}: ${type}`);

      // 如果是函数，显示参数
      if (type === 'function') {
        console.log(`       参数: ${val.length} 个`);
      }

      // 如果是类，显示原型方法
      if (type === 'function' && val.prototype) {
        const protoMethods = Object.getOwnPropertyNames(val.prototype)
          .filter(m => m !== 'constructor')
          .slice(0, 5);
        if (protoMethods.length > 0) {
          console.log(`       原型方法: ${protoMethods.join(', ')}`);
        }
      }
    });

    // 检查是否有 lz4XorDecode
    console.log('\n   检查关键方法:');
    console.log('     bon.lz4XorDecode:', typeof bon.lz4XorDecode);
    console.log('     bon.decrypt:', typeof bon.decrypt);
    console.log('     bon.decode:', typeof bon.decode);
    console.log('     bon.BonDecoder:', typeof bon.BonDecoder);

    if (bon.BonDecoder) {
      console.log('\n   BonDecoder 原型方法:');
      const decoder = new bon.BonDecoder();
      const decoderMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(decoder));
      decoderMethods.forEach(m => {
        console.log(`     ${m}: ${typeof decoder[m]}`);
      });
    }
  } else {
    console.log('   ❌ 未找到 bon 模块');
  }

  // 4. 测试 data-index 方式
  console.log('\n4. 测试 data-index 方式:');

  try {
    const mod13 = window.__require('data-index', 13);
    console.log('   data-index 13:', typeof mod13);
    if (mod13) {
      console.log('   方法:', Object.keys(mod13).slice(0, 10).join(', '));
    }
  } catch (e) {
    console.log('   data-index 13: 错误 -', e.message);
  }

  // 5. 保存结果到全局变量
  window.__diagnoseResults = results;
  console.log('\n5. 结果已保存到 window.__diagnoseResults');
  console.log('   可以在控制台输入 __diagnoseResults 查看');

})();
