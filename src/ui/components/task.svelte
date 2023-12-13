<script lang="ts">
  
import type { UnscheduledTask } from "../../types";

  export let task: UnscheduledTask;
  export let handleTaskMouseUp;
  export let handleToogle;
  // todo: this should live in useTaskVisuals
  export let relationToNow = "";
  let checked = task.text.startsWith("- [x]");

  function handleCheckBoxClick() {
    handleToogle(task);
  }

  function handleTextClick() {
    handleTaskMouseUp(task);
  }
</script>

<div
  style:width="{task?.placing?.widthPercent || 100}%"
  style:left="{task?.placing?.xOffsetPercent || 0}%"
  class="task-padding-box"
>
  <div
    class="task-block {relationToNow}"
    class:is-ghost={task.isGhost}
    on:mousedown={(event) => event.stopPropagation()}
    on:mouseup
  >
    <input
      type="checkbox"
      bind:checked={checked}
      on:click={handleCheckBoxClick}
    />
    <div on:click={handleTextClick}>
      {task.text.replace(/^- \[.?\]/, '')}
    </div>
    <slot />
  </div>
</div>

<style>
  .task-padding-box {
    position: var(--task-position, static);
    top: var(--task-offset);
    left: 0;

    display: flex;

    width: 100%;
    height: var(--task-height);
    padding: 0 1px 2px;

    transition: 0.05s linear;
  }

  .task-block {
    position: relative;

    overflow: hidden;
    display: flex;
    flex: 1 0 0;

    padding: 4px 6px 6px;

    font-size: var(--font-ui-small);
    text-align: left;
    overflow-wrap: anywhere;
    white-space: normal;

    background-color: var(--task-background-color, var(--background-primary));
    border: 1px solid var(--color-base-50);
    border-radius: var(--radius-s);
  }

  .past {
    background-color: var(--background-secondary);
  }

  .present {
    border-color: var(--color-accent);
  }

  .is-ghost {
    opacity: 0.6;
  }
</style>
