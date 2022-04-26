require('dotenv').config();
const { KintoneRestAPIClient } = require("@kintone/rest-api-client");
const dayjs   = require('dayjs');
const dotenv  = process.env;
const mail    = require("./src/mail_to");
// const kintone = require("./src/kintone");

const client = new KintoneRestAPIClient({
  baseUrl: `https://${dotenv.KINTONE_SUBDOMAIN}.cybozu.com`,
  auth: {
    username: dotenv.KINTONE_USERNAME,
    password: dotenv.KINTONE_PASSWORD,
  },
});

/**
 * メール送信
 */
// mail.send({
//   to      : 'k.nishizoe131@gmail.com',
//   subject : 'テストメール',
//   html    : '<strong>テスト本文</strong>',
// }).then(resp => {
//   console.log(resp)
// }).catch(console.error);

client.record.getAllRecords({ app: 99 }).then(async resp => {
  // プランマスターアプリ
  const plan_master = resp.records;

  /** *****************************************************************
   * 解約日前日
   ***************************************************************** */
  if(dayjs().format('DD') == '15') {

  }

  /** *****************************************************************
   * 延長開始日
   ***************************************************************** */
  else if (dayjs().format('DD') == '01') {

  }

  /** *****************************************************************
   * 契約管理アプリ レコード取得
   * - 契約ステータス == "契約中"
   ***************************************************************** */
  const contracts = await client.record.getAllRecords({
    app      : 83,  // 契約管理アプリID
    condition: '契約ステータス in ("契約中")',
  });

  // 契約管理アプリ 各レコード検査
  for (const contract of contracts) {
    const svc_endDate = contract['サービス終了日'].value;
    const record  = {};
    const today   = dayjs().format('YYYY-MM-DD');

    if (svc_endDate) {
      // ---------------------------
      // サービス終了日に値あり

      if ( dayjs().isAfter(dayjs(svc_endDate)) ) {
        // 当プログラム実行日がサービス終了日より後の場合
        record['契約ステータス'] = { value: '契約終了' };
      } else {
        continue;
      }
    } else {
      // ---------------------------
      // サービス終了日に値なし
      const cont_table = contract['契約明細テーブル'].value;

      const sch = cont_table.find(v => v.value['契約状態'].value == '予定');
      if (sch) {
        // ---------------------------------------------
        // 契約明細テーブルに「予定」のプランあり
        for (const row of cont_table) {
          if (row.value['契約状態'].value == '予定') {
            // console.log(JSON.stringify(row));
            row.value['契約状態'].value = '契約';
          } else {
            continue;
          }
        }
      } else {
        // ---------------------------------------------
        // 契約明細テーブルに「予定」のプランなし
        const plan = plan_master.find(v => v['プラン名'].value == 'はじめてパック延長');
        // プランを追加
        cont_table.push({
          value: {
            '契約状態': { value: '契約' },
            '契約品目': { value: 'はじめてパック延長' },
            '契約詳細': { value: '' },
            '契約受付': { value: '' },
            '契約開始': { value: '' },
            '契約終了': { value: '' },
            '契約数量': { value: '' },
            '契約単位': { value: '' },
            '契約金額': { value: '' },
            '契約摘要': { value: '' },
            'プランレコード番号': { value: plan.$id.value },
          }
        });

        record['契約サービス名'] = { value: plan['プラン名'].value };
        record['サービス金額']   = { value: plan['プラン金額'].value };
        record['サービス開始日'] = { value: today };
        record['サービス終了日'] = { value: dayjs().endOf('month').format('YYYY-MM-DD') };
      }
    }

    if(Object.keys(record).length) {
      client.record.updateRecord({
        app   : 83, // 契約管理アプリID
        id    : contract.$id.value,
        record: record,
      });
    }
  }
});