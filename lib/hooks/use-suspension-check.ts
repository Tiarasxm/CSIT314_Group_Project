import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function useSuspensionCheck() {
  const [isSuspended, setIsSuspended] = useState(false);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const checkSuspension = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const { data: userData } = await supabase
        .from("users")
        .select("is_suspended")
        .eq("id", user.id)
        .single();

      setIsSuspended(userData?.is_suspended || false);
      setLoading(false);
    };

    checkSuspension();
  }, [supabase]);

  return { isSuspended, loading };
}

