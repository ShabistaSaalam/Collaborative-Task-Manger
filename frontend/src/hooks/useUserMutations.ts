import { useMutation, useQueryClient } from "@tanstack/react-query";
import { userApi } from "@/lib/api";
import { User } from "@/types";

/**
 * Centralized user mutations with optimistic updates
 */
export const useUserMutations = () => {
  const queryClient = useQueryClient();

  const updateUserProfile = useMutation({
    mutationFn: (updates: Partial<User>) => userApi.updateProfile(updates),

    onMutate: async (updates) => {
      await queryClient.cancelQueries({ queryKey: ["user"] });

      const previousUser = queryClient.getQueryData<User>(["user"]);

      if (!previousUser) {
        throw new Error("No user data found");
      }

      queryClient.setQueryData<User>(["user"], {
        ...previousUser,
        ...updates,
      });

      return { previousUser };
    },

    onError: (_err, _vars, ctx) => {
      if (ctx?.previousUser) {
        queryClient.setQueryData(["user"], ctx.previousUser);
      }
      console.error("❌ Failed to update user profile:", _err);
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user"] });
      console.log("✅ User profile updated successfully");
    },
  });

  return {
    updateUserProfile,
  };
};