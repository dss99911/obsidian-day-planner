import { Moment } from "moment/moment";
import { get, Readable, Writable } from "svelte/store";

import { ObsidianFacade } from "../../../service/obsidian-facade";
import { PlacedTask, UnscheduledTask } from "../../../types";
import { copy } from "../../../util/task-utils";

import { createTask } from "./transform/create";
import { EditMode, EditOperation } from "./types";

export interface UseEditHandlersProps {
  startEdit: any;
  day: Moment;
  obsidianFacade: ObsidianFacade;
  cursorMinutes: Readable<number>;
  editOperation: Writable<EditOperation>;
}

export function useEditHandlers({
  day,
  obsidianFacade,
  startEdit,
  cursorMinutes,
  editOperation,
}: UseEditHandlersProps) {
  async function handleMouseDown() {
    const newTask = await createTask(day, get(cursorMinutes));

    startEdit({
      task: { ...newTask, isGhost: true },
      mode: EditMode.CREATE,
      day,
    });
  }

  function handleResizeStart(event: MouseEvent, task: PlacedTask) {
    const mode = event.ctrlKey
      ? EditMode.RESIZE_AND_SHIFT_OTHERS
      : EditMode.RESIZE;

    startEdit({ task, mode, day });
  }

  async function handleTaskMouseUp(task: UnscheduledTask) {
    if (get(editOperation)) {
      return;
    }

    const { path, line } = task.location;
    await obsidianFacade.revealLineInFile(path, line);
  }

  function handleGripMouseDown(event: MouseEvent, task: PlacedTask) {
    if (event.ctrlKey) {
      startEdit({ task, mode: EditMode.DRAG_AND_SHIFT_OTHERS, day });
    } else if (event.shiftKey) {
      startEdit({ task: copy(task), mode: EditMode.CREATE, day });
    } else {
      startEdit({ task, mode: EditMode.DRAG, day });
    }
  }

  function startScheduling(task: UnscheduledTask) {
    const withAddedTime = {
      ...task,
      startMinutes: get(cursorMinutes),
      // todo: remove this. It's added just for type compatibility
      startTime: window.moment(),
    };

    startEdit({ task: withAddedTime, mode: EditMode.SCHEDULE, day });
  }

  function handleMouseEnter() {
    if (get(editOperation)) {
      editOperation.update((prev) => ({ ...prev, day }));
    }
  }

  return {
    handleMouseEnter,
    handleMouseDown,
    handleResizeStart,
    handleTaskMouseUp,
    handleGripMouseDown,
    startScheduling,
  };
}