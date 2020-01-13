import * as path from "path";
import * as exec from "@actions/exec";

interface Options {
  token: string;
  profile: string;
  parallel: boolean;
  parallel_finished: boolean;
  job_number: string;
  working_directory: string;
}

export async function goveralls(options: Options) {
  if (options.parallel_finished) {
    await finish(options);
  } else {
    await run(options);
  }
}

async function run(options: Options) {
  const env = {
    COVERALLS_TOKEN: options.token
  };

  // copy environment values related to Go
  const names = [
    "PATH",
    "GOROOT",
    "GOPATH",
    "GOBIN",
    "GOTMPDIR",
    "GOTOOLDIR",
    "GOOS",
    "GOARCH",

    // GOCAHE and fall back directories
    "GOCACHE",
    "LocalAppData",
    "HOME",
    "XDG_CACHE_HOME",

    // GitHub events information
    "GITHUB_WORKFLOW",
    "GITHUB_ACTION",
    "GITHUB_ACTIONS",
    "GITHUB_ACTOR",
    "GITHUB_REPOSITORY",
    "GITHUB_EVENT_NAME",
    "GITHUB_EVENT_PATH",
    "GITHUB_WORKSPACE",
    "GITHUB_SHA",
    "GITHUB_REF",
    "GITHUB_HEAD_REF",
    "GITHUB_BASE_REF"
  ];
  for (const name of names) {
    const value = process.env[name];
    if (value) {
      env[name] = value;
    }
  }
  const args = [
    `-coverprofile=${options.profile}`,
    "-service=github"
  ];
  if (options.parallel) {
    args.push("-parallel");
    if (options.job_number !== "") {
      args.push(`-jobnumber=${options.job_number}`);
    }
  }
  await exec.exec(get_goveralls_path(), args, {
    env: env,
    cwd: options.working_directory
  });
}

async function finish(options: Options) {
  const env = {
    COVERALLS_TOKEN: options.token
  };
  const args = [
    "-parallel-finish"
  ];
  await exec.exec(get_goveralls_path(), args, {
    env: env,
    cwd: options.working_directory
  });
}

function get_goveralls_path(): string {
  const name =
    process.platform === "win32"
      ? "goveralls_windows_amd64.exe"
      : `goveralls_${process.platform}_amd64`;
  return path.join(__dirname, "..", "bin", name);
}
