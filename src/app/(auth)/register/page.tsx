import { redirect } from "next/navigation";

// Registration uses the same flow as login (magic link creates account if needed)
export default function RegisterPage() {
  redirect("/login");
}
