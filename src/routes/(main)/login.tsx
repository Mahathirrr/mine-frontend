import { createFileRoute, Link } from "@tanstack/react-router";

import { APP_CONFIG } from "@/config/app-config";
import { redirectIfAuthenticated } from "@/lib/auth/guard";
import { useRedirectIfAuthenticated } from "@/lib/auth/use-redirect-if-authenticated";
import { AuthPageLayout } from "@/routes/(main)/auth/-components/auth-page-layout";
import { LoginForm } from "@/routes/(main)/auth/-components/login-form";

export const Route = createFileRoute("/(main)/login")({
  beforeLoad: () => {
    redirectIfAuthenticated();
  },
  component: LoginPage,
});

function LoginPage() {
  useRedirectIfAuthenticated();

  return (
    <AuthPageLayout>
      <div className="mx-auto flex w-full flex-col justify-center space-y-8 sm:w-[350px]">
        <div className="space-y-2 text-center">
          <h1 className="font-medium text-3xl">Masuk</h1>
          <p className="text-muted-foreground text-sm">Masukkan email dan kata sandi untuk melanjutkan.</p>
        </div>
        <LoginForm />
      </div>

      <div className="absolute top-5 flex w-full justify-end px-10">
        <div className="text-muted-foreground text-sm">
          Belum punya akun?{" "}
          <Link className="text-foreground" to="/register">
            Daftar
          </Link>
        </div>
      </div>

      <div className="absolute bottom-5 flex w-full justify-between px-10">
        <div className="text-sm">{APP_CONFIG.copyright}</div>
      </div>
    </AuthPageLayout>
  );
}
