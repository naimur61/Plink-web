import jsonfile from "jsonfile";
import moment from "moment";
import simpleGit from "simple-git";
import random from "random";
import { readFileSync } from "fs";

const git = simpleGit();
const msgs = JSON.parse(readFileSync("./commit_messages.json")).commits;

const config = {
  total: 683,
  startYear: 2021,
  endYear: 2025,
  workHours: [6, 8],
  weekendSkipChance: 0.7,
  maxPerDay: 6,
};

async function main() {
  console.log(
    `🚀 Creating ${config.total} commits (${config.startYear}-${config.endYear})\n`,
  );

  let created = 0;
  const tracker = {};
  const start = Date.now();

  while (created < config.total) {
    const year = random.int(config.startYear, config.endYear);
    const month = random.int(0, 11);
    const day = random.int(1, 28);

    const date = moment().year(year).month(month).date(day);
    const dateKey = date.format("YYYY-MM-DD");

    // Realistic patterns
    if (
      [0, 6].includes(date.day()) &&
      random.float() < config.weekendSkipChance
    )
      continue;
    tracker[dateKey] = (tracker[dateKey] || 0) + 1;
    if (tracker[dateKey] > config.maxPerDay) continue;

    // Realistic time
    date
      .hour(random.int(config.workHours[0], config.workHours[1]))
      .minute(random.int(0, 59))
      .second(random.int(0, 59));

    // Make commit
    await jsonfile.writeFile("./data.json", { date: date.format() });
    await git.add(["./data.json"]);
    await git.commit(msgs[random.int(0, msgs.length - 1)], {
      "--date": date.format(),
    });

    created++;
    process.stdout.write(
      `\r📈 ${created}/${config.total} (${((created / config.total) * 100).toFixed(1)}%)`,
    );

    // Natural delay
    await new Promise((r) => setTimeout(r, random.int(30, 120)));
  }

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`\n\n✅ Created ${created} commits in ${elapsed}s`);

  // Show distribution
  console.log("\n📊 Yearly Distribution:");
  const years = {};
  Object.keys(tracker).forEach((d) => {
    const y = d.split("-")[0];
    years[y] = (years[y] || 0) + tracker[d];
  });

  Object.entries(years)
    .sort()
    .forEach(([year, count]) => {
      console.log(
        `  ${year}: ${count} commits (${((count / config.total) * 100).toFixed(1)}%)`,
      );
    });

  console.log("\n📤 Pushing to GitHub...");
  await git.push();
  console.log("🚀 Success!");
}

main().catch(console.error);
