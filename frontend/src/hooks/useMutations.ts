import { useMutation, useQueryClient } from "@tanstack/react-query";
import { taskApi } from "@/lib/api";
import { Task } from "@/types";

/**
 * Centralized task mutations with optimistic updates
 */
export const useMutations = () => {
  const queryClient = useQueryClient();

  const createTask = useMutation({
    mutationFn: taskApi.create,

    onMutate: async (newTask) => {
      await queryClient.cancelQueries({ queryKey: ["tasks"] });

      const previousTasks =
        queryClient.getQueryData<Task[]>(["tasks"]) || [];

      const optimisticTask: Task = {
        ...(newTask as Task),
        id: `temp-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      queryClient.setQueryData<Task[]>(["tasks"], (old = []) => [
        optimisticTask,
        ...old,
      ]);

      return { previousTasks };
    },

    onError: (_err, _vars, ctx) => {
      if (ctx?.previousTasks) {
        queryClient.setQueryData(["tasks"], ctx.previousTasks);
      }
      console.error("❌ Failed to create task:", _err);
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      console.log("✅ Task created successfully");
    },
  });

  const updateTask = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Task> }) =>
      taskApi.update(id, updates),

    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: ["tasks"] });

      const previousTasks =
        queryClient.getQueryData<Task[]>(["tasks"]) || [];

      queryClient.setQueryData<Task[]>(["tasks"], (old = []) =>
        old.map((task) =>
          task.id === id
            ? { ...task, ...updates, updatedAt: new Date().toISOString() }
            : task
        )
      );

      return { previousTasks };
    },

    onError: (_err, _vars, ctx) => {
      if (ctx?.previousTasks) {
        queryClient.setQueryData(["tasks"], ctx.previousTasks);
      }
      console.error("❌ Failed to update task:", _err);
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      console.log("✅ Task updated successfully");
    },
  });

  const deleteTask = useMutation({
    mutationFn: (id: string) => taskApi.delete(id),

    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["tasks"] });

      const previousTasks =
        queryClient.getQueryData<Task[]>(["tasks"]) || [];

      queryClient.setQueryData<Task[]>(["tasks"], (old = []) =>
        old.filter((task) => task.id !== id)
      );

      return { previousTasks };
    },

    onError: (_err, _id, ctx) => {
      if (ctx?.previousTasks) {
        queryClient.setQueryData(["tasks"], ctx.previousTasks);
      }
      console.error("❌ Failed to delete task:", _err);
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      console.log("✅ Task deleted successfully");
    },
  });

  return {
    createTask,
    updateTask,
    deleteTask,
  };
};