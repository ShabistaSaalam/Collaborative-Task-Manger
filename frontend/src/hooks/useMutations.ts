import { useMutation, useQueryClient } from "@tanstack/react-query";
import { taskApi } from "@/lib/api";
import { Task } from "@/types";

export const useMutations = () => {
  const queryClient = useQueryClient();

  const createTask = useMutation({
    mutationFn: taskApi.create,
    onMutate: async (newTask) => {
      await queryClient.cancelQueries({ queryKey: ["tasks"] });
      const previousTasks = queryClient.getQueryData<Task[]>(["tasks"]) || [];

      const tempId = `temp-${Date.now()}`;
      const optimisticTask: Task = {
        ...(newTask as Task),
        id: tempId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      queryClient.setQueryData<Task[]>(["tasks"], (old = []) => [
        optimisticTask,
        ...old,
      ]);

      return { previousTasks, tempId };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previousTasks) {
        queryClient.setQueryData(["tasks"], ctx.previousTasks);
      }
    },
    onSuccess: (response, _vars, ctx) => {
      // 🎯 THE FIX: Reach into response.data.task
      // The log you showed has the task inside 'data' -> 'task'
      const realTask = response.data?.task;

      if (!realTask) {
        console.error("Task data missing from response", response);
        return;
      }

      queryClient.setQueryData<Task[]>(["tasks"], (old = []) =>
        old.map((t) => {
          if (t.id === ctx?.tempId) {
            // Swap the temp object entirely with the clean server object
            // This ensures the ID changes from 'temp-xxx' to the real MongoDB ID
            return {
              ...realTask,
              // We don't need to manually merge status/priority anymore 
              // because realTask is now the actual Task object from the DB.
            };
          }
          return t;
        })
      );
    },
  });

  const updateTask = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) =>
      taskApi.update(id, updates),

    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: ["tasks"] });
      const previousTasks = queryClient.getQueryData<Task[]>(["tasks"]) || [];

      queryClient.setQueryData<Task[]>(["tasks"], (old = []) =>
        old.map((task) =>
          task.id === id
            ? {
              ...task,
              ...updates, // This now includes the 'assignedTo' object we "sneaked" in
              updatedAt: new Date().toISOString()
            }
            : task
        )
      );

      return { previousTasks };
    },

    onError: (_err, _vars, ctx) => {
      if (ctx?.previousTasks) {
        queryClient.setQueryData(["tasks"], ctx.previousTasks);
      }
    },

    onSuccess: (response) => {
      const updatedTask = response.data?.task || response.data;
      if (!updatedTask) return;

      queryClient.setQueryData<Task[]>(["tasks"], (old = []) =>
        old.map((task) => (task.id === updatedTask.id ? updatedTask : task))
      );
    },
  });
  const deleteTask = useMutation({
    mutationFn: (id: string) => taskApi.delete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["tasks"] });

      // 1. Capture the current state before we delete
      const previousTasks = queryClient.getQueryData<Task[]>(["tasks"]) || [];

      // 2. Optimistically remove it from the UI
      queryClient.setQueryData<Task[]>(["tasks"], (old = []) =>
        old.filter((task) => task.id !== id)
      );

      // 3. Return the backup so onError can use it
      return { previousTasks };
    },
    // 🎯 THE FIX: If the server says "Unauthorized", put the tasks back!
    onError: (err, id, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(["tasks"], context.previousTasks);
      }
      // Optional: Log why it failed (e.g., "Not authorized")
      console.error("Delete failed:", err);
    },
    onSuccess: () => {
      console.log("✅ Task deleted successfully from DB");
    },
  });

  return { createTask, updateTask, deleteTask };
};