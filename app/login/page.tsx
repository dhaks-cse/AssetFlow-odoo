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
        <FadeIn>
          <Card className="w-full max-w-sm">
            <CardHeader>
              <CardTitle>Sign in to AssetFlow</CardTitle>
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
