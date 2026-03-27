/**
 * @file Sign Up Page
 * @description User registration page with role selection (Customer or Business Owner).
 * The form logic is extracted into SignUpForm (Client Component)
 * so this page can remain a Server Component and export metadata.
 *
 * URL: /sign-up
 */

import { SignUpForm } from "./sign-up-form";

export const metadata = {
  title: "Sign Up",
};

export default function SignUpPage() {
  return <SignUpForm />;
}
