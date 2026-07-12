import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SignupForm } from "@/components/auth/signup-form";
import { FadeIn } from "@/components/motion/fade-in";

export default function SignupPage() {
  return (
    <main className="flex flex-1 items-center justify-center p-4">
      <FadeIn className="w-full max-w-md px-4">
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-xl">Create your account</CardTitle>
            <CardDescription>
              New accounts start as Employee. An Admin can promote your role later.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SignupForm />
          </CardContent>
        </Card>
      </FadeIn>
    </main>
  );
}
