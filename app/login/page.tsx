import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoginForm } from "@/components/auth/login-form";
import { Preloader } from "@/components/preloader";
import { FadeIn } from "@/components/motion/fade-in";

export default function LoginPage() {
  return (
    <Preloader>
      <main className="flex flex-1 items-center justify-center p-4">
        <FadeIn className="w-full max-w-md px-4">
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="text-xl">Sign in to AssetFlow</CardTitle>
              <CardDescription>Enterprise asset &amp; resource management</CardDescription>
            </CardHeader>
            <CardContent>
              <LoginForm />
            </CardContent>
          </Card>
        </FadeIn>
      </main>
    </Preloader>
  );
}
