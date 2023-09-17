import { difference, partition } from "lodash/fp";
import type { CachedMetadata } from "obsidian";

import { getHeadingByText, getListItemsUnderHeading } from "../parser/parser";
import { taskLineToString } from "../parser/timestamp/timestamp";
import type { DayPlannerSettings } from "../settings";
import type { PlanItem } from "../types";

import type { ObsidianFacade } from "./obsidian-facade";
import { isEqualTask } from "./task-utils";

export class PlanEditor {
  constructor(
    private readonly settings: DayPlannerSettings,
    private readonly obsidianFacade: ObsidianFacade,
  ) {}

  syncTasksWithFile = async (baseline: PlanItem[], updated: PlanItem[]) => {
    const pristine = updated.filter((task) =>
      baseline.find((baselineTask) => isEqualTask(task, baselineTask)),
    );

    const dirty = difference(updated, pristine);
    const [edited, created] = partition((task) => task.location.line, dirty);
    const path = updated[0].location.path;

    await this.obsidianFacade.editFile(path, (contents) => {
      const withUpdatedEdited = edited.reduce(
        (result, current) => this.updateTaskInFileContents(result, current),
        contents,
      );

      const createdList = created.map((task) =>
        taskLineToString(task, { ...task }),
      );
      const metadata = this.obsidianFacade.getMetadataForPath(path) || {};
      const [planEndLine, splitContents] = this.getPlanEndLine(
        withUpdatedEdited.split("\n"),
        metadata,
      );

      // todo: use immutable array methods
      const result = [...splitContents];
      result.splice(planEndLine + 1, 0, ...createdList);
      return result.join("\n");
    });
  };

  createPlannerHeading() {
    const { plannerHeading, plannerHeadingLevel } = this.settings;

    const headingTokens = "#".repeat(plannerHeadingLevel);

    return `${headingTokens} ${plannerHeading}`;
  }

  // todo: we might want to update not only duration. Better: syncTaskWithNote
  private updateTaskInFileContents(contents: string, task: PlanItem) {
    return contents
      .split("\n")
      .map((line, index) => {
        // todo: if a task is newly created, it's not going to have a line. We need a clearer way to track this information
        if (index === task.location?.line) {
          // todo: this may break if I don't sync duration manually everywhere. Need a getter for endMinutes
          return taskLineToString(task, {
            startMinutes: task.startMinutes,
            durationMinutes: task.durationMinutes,
          });
        }

        return line;
      })
      .join("\n");
  }

  getPlanEndLine(
    contents: string[],
    metadata: CachedMetadata,
  ): [number, string[]] {
    const planHeading = getHeadingByText(
      metadata,
      this.settings.plannerHeading,
    );

    const planListItems = getListItemsUnderHeading(
      metadata,
      this.settings.plannerHeading,
    );

    if (planListItems?.length > 0) {
      const lastListItem = planListItems[planListItems.length - 1];

      return [lastListItem.position.start.line, contents];
    }

    if (planHeading) {
      return [planHeading.position.start.line, contents];
    }

    const withNewPlan = [...contents, "", this.createPlannerHeading(), ""];

    return [withNewPlan.length, withNewPlan];
  }
}