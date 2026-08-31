const categories = [
  { code: "01", name: "運転・運用マニュアル" },
  { code: "02", name: "保守・点検作業マニュアル" },
  { code: "03", name: "緊急時対応マニュアル" },
  { code: "04", name: "分析・測定マニュアル" }
];

const documents = [
  { no: "01-001", category: "01", categoryName: "運転・運用マニュアル", title: "ボイラー起動手順", date: "2026-08-01", url: "https://sharepoint.example.com/manuals/01-001" },
  { no: "01-002", category: "01", categoryName: "運転・運用マニュアル", title: "冷却水ポンプ運転手順", date: "2026-07-18", url: "https://sharepoint.example.com/manuals/01-002" },
  { no: "01-003", category: "01", categoryName: "運転・運用マニュアル", title: "日常点検と設備停止手順", date: "2026-06-30", url: "https://sharepoint.example.com/manuals/01-003" },
  { no: "02-001", category: "02", categoryName: "保守・点検作業マニュアル", title: "ポンプ分解・組立作業", date: "2026-07-25", url: "https://sharepoint.example.com/manuals/02-001" },
  { no: "02-002", category: "02", categoryName: "保守・点検作業マニュアル", title: "電動機絶縁抵抗測定", date: "2026-05-12", url: "https://sharepoint.example.com/manuals/02-002" },
  { no: "02-003", category: "02", categoryName: "保守・点検作業マニュアル", title: "バルブ定期交換作業", date: "2026-04-08", url: "https://sharepoint.example.com/manuals/02-003" },
  { no: "03-001", category: "03", categoryName: "緊急時対応マニュアル", title: "停電発生時の初動対応", date: "2026-08-10", url: "https://sharepoint.example.com/manuals/03-001" },
  { no: "03-002", category: "03", categoryName: "緊急時対応マニュアル", title: "ボイラー異常時対応", date: "2026-03-22", url: "https://sharepoint.example.com/manuals/03-002" },
  { no: "04-001", category: "04", categoryName: "分析・測定マニュアル", title: "水質分析サンプリング手順", date: "2026-07-02", url: "https://sharepoint.example.com/manuals/04-001" },
  { no: "04-002", category: "04", categoryName: "分析・測定マニュアル", title: "排ガス測定器校正手順", date: "2026-02-15", url: "https://sharepoint.example.com/manuals/04-002" }
];

