// FIFA World Cup 2026 結果取得スクリプト（キー不要）
// データ源: openfootball/worldcup.json (パブリックドメイン)
// 出力: results.json （日本語チーム名・終了試合のスコア）
import { writeFile, readFile } from "node:fs/promises";

const SRC =
  "https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json";

// 英語名 → 日本語名（wc2026.html の G[] と一致させる）
const JP = {
  "Mexico": "メキシコ", "South Korea": "韓国", "Czech Republic": "チェコ", "South Africa": "南アフリカ",
  "Canada": "カナダ", "Bosnia & Herzegovina": "ボスニア・H", "Qatar": "カタール", "Switzerland": "スイス",
  "Brazil": "ブラジル", "Morocco": "モロッコ", "Haiti": "ハイチ", "Scotland": "スコットランド",
  "USA": "アメリカ", "Paraguay": "パラグアイ", "Australia": "オーストラリア", "Turkey": "トルコ",
  "Germany": "ドイツ", "Curaçao": "キュラソー", "Ivory Coast": "コートジボワール", "Ecuador": "エクアドル",
  "Netherlands": "オランダ", "Japan": "日本", "Sweden": "スウェーデン", "Tunisia": "チュニジア",
  "Belgium": "ベルギー", "Egypt": "エジプト", "Iran": "イラン", "New Zealand": "ニュージーランド",
  "Spain": "スペイン", "Cape Verde": "カーボベルデ", "Saudi Arabia": "サウジアラビア", "Uruguay": "ウルグアイ",
  "France": "フランス", "Senegal": "セネガル", "Iraq": "イラク", "Norway": "ノルウェー",
  "Argentina": "アルゼンチン", "Algeria": "アルジェリア", "Austria": "オーストリア", "Jordan": "ヨルダン",
  "Portugal": "ポルトガル", "DR Congo": "DRコンゴ", "Uzbekistan": "ウズベキスタン", "Colombia": "コロンビア",
  "England": "イングランド", "Croatia": "クロアチア", "Ghana": "ガーナ", "Panama": "パナマ"
};

const r = await fetch(SRC, { headers: { "User-Agent": "wc2026-updater" } });
if (!r.ok) throw new Error("fetch failed: " + r.status);
const data = await r.json();

const results = [];
for (const m of data.matches || []) {
  const ft = m.score && m.score.ft;
  if (!Array.isArray(ft) || ft.length < 2) continue;       // 未終了はスキップ
  const home = JP[m.team1], away = JP[m.team2];
  if (!home || !away) continue;                            // 決勝T等の未確定枠はスキップ
  results.push({
    group: (m.group || "").replace("Group ", "") || null,
    home, away,
    hs: ft[0], as: ft[1],
    status: "FT"
  });
}

// 既存の results.json と比較し、スコアに変化があるときだけ書き換える
// （変化が無ければファイルを触らない → 無駄なコミット/再デプロイを防ぐ）
let prevResults = null;
try {
  const prev = JSON.parse(await readFile("results.json", "utf8"));
  prevResults = JSON.stringify(prev.results ?? null);
} catch {
  // 初回などファイルが無い/壊れている場合はそのまま書き込む
}

const nextResults = JSON.stringify(results);
if (prevResults === nextResults) {
  console.log(`no change (${results.length} finished matches) — skip write`);
} else {
  const payload = { updated: new Date().toISOString(), results };
  await writeFile("results.json", JSON.stringify(payload, null, 2) + "\n");
  console.log(`updated results.json (${results.length} finished matches)`);
}
