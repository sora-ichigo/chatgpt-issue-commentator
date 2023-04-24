import * as core from "@actions/core";

import { run } from "./run";

try {
  run();
} catch (e: any) {
  core.setFailed(e);
}
