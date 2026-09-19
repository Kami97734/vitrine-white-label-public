const { execSync } = require("child_process")
execSync("npx prisma db push --skip-generate", { stdio: "inherit", cwd: __dirname + "/.." })
execSync("npx ts-node -P tsconfig.seed.json prisma/seed.ts", { stdio: "inherit", cwd: __dirname + "/.." })
