"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useId, useTransition } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { applyAddress } from "@/lib/actions/checkout";
import { isRedirectError } from "@/lib/utils/redirect-error";
import {
  type CheckoutAddressInput,
  checkoutAddressInputSchema,
} from "@/lib/validations/checkout";

function CheckoutAddressForm() {
  const nameId = useId();
  const emailId = useId();
  const phoneId = useId();
  const address1Id = useId();
  const address2Id = useId();
  const cityId = useId();
  const stateId = useId();
  const pincodeId = useId();
  const passwordId = useId();
  const createAccountId = useId();
  const searchParams = useSearchParams();
  const router = useRouter();
  const checkoutSessionId = searchParams.get("session");
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CheckoutAddressInput>({
    resolver: zodResolver(checkoutAddressInputSchema),
    defaultValues: {
      country: "India",
      createAccount: false,
    },
  });

  const createAccount = watch("createAccount");

  const onSubmit = (data: CheckoutAddressInput) => {
    if (!checkoutSessionId) {
      router.push("/checkout");
      return;
    }

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("checkoutSessionId", checkoutSessionId);
        formData.append("name", data.name);
        formData.append("email", data.email);
        formData.append("phone", data.phone);
        formData.append("address1", data.address1);
        if (data.address2) formData.append("address2", data.address2);
        formData.append("city", data.city);
        formData.append("state", data.state);
        formData.append("pincode", data.pincode);
        formData.append("country", data.country || "India");
        // Include password if user wants to create an account
        if (data.createAccount && data.password) {
          formData.append("password", data.password);
        }

        await applyAddress(formData);
        // Server action handles redirect via redirect() call
      } catch (error) {
        // Re-throw redirect errors - Next.js needs these to perform navigation
        if (isRedirectError(error)) {
          throw error;
        }

        // Only handle actual errors, not redirects
        const errorMessage = encodeURIComponent(
          error instanceof Error ? error.message : "Failed to save address",
        );
        router.push(`/checkout/error?message=${errorMessage}`);
      }
    });
  };

  if (!checkoutSessionId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-destructive mb-4">Invalid checkout session</p>
            <Button onClick={() => router.push("/checkout")}>
              Start Checkout
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-8">Shipping Address</h1>

      <Card>
        <CardHeader>
          <CardTitle>Enter your shipping details</CardTitle>
          <CardDescription>
            We'll use this address to calculate shipping and deliver your order
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label
                htmlFor={nameId}
                className="block text-sm font-medium mb-2"
              >
                Full Name *
              </label>
              <Input id={nameId} {...register("name")} disabled={isPending} />
              {errors.name && (
                <p className="text-sm text-destructive mt-1">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor={emailId}
                  className="block text-sm font-medium mb-2"
                >
                  Email *
                </label>
                <Input
                  id={emailId}
                  type="email"
                  {...register("email")}
                  disabled={isPending}
                />
                {errors.email && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor={phoneId}
                  className="block text-sm font-medium mb-2"
                >
                  Phone *
                </label>
                <Input
                  id={phoneId}
                  type="tel"
                  {...register("phone")}
                  disabled={isPending}
                />
                {errors.phone && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.phone.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label
                htmlFor={address1Id}
                className="block text-sm font-medium mb-2"
              >
                Address Line 1 *
              </label>
              <Input
                id={address1Id}
                {...register("address1")}
                disabled={isPending}
              />
              {errors.address1 && (
                <p className="text-sm text-destructive mt-1">
                  {errors.address1.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor={address2Id}
                className="block text-sm font-medium mb-2"
              >
                Address Line 2 (optional)
              </label>
              <Input
                id={address2Id}
                {...register("address2")}
                disabled={isPending}
              />
              {errors.address2 && (
                <p className="text-sm text-destructive mt-1">
                  {errors.address2.message}
                </p>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor={cityId}
                  className="block text-sm font-medium mb-2"
                >
                  City *
                </label>
                <Input id={cityId} {...register("city")} disabled={isPending} />
                {errors.city && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.city.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor={stateId}
                  className="block text-sm font-medium mb-2"
                >
                  State *
                </label>
                <Input
                  id={stateId}
                  {...register("state")}
                  disabled={isPending}
                />
                {errors.state && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.state.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label
                htmlFor={pincodeId}
                className="block text-sm font-medium mb-2"
              >
                PIN Code *
              </label>
              <Input
                id={pincodeId}
                maxLength={10}
                {...register("pincode")}
                disabled={isPending}
              />
              {errors.pincode && (
                <p className="text-sm text-destructive mt-1">
                  {errors.pincode.message}
                </p>
              )}
            </div>

            {/* Account Creation Section */}
            <div className="pt-4 border-t">
              <div className="flex items-start gap-3">
                <Checkbox
                  id={createAccountId}
                  checked={createAccount}
                  onCheckedChange={(checked) =>
                    setValue("createAccount", checked === true)
                  }
                  disabled={isPending}
                  className="mt-1"
                />
                <div className="flex-1">
                  <label
                    htmlFor={createAccountId}
                    className="text-sm font-medium cursor-pointer"
                    onClick={() => setValue("createAccount", !createAccount)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setValue("createAccount", !createAccount);
                      }
                    }}
                  >
                    Create an account for faster checkout
                  </label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Save your information for future orders
                  </p>
                </div>
              </div>

              {createAccount && (
                <div className="mt-4">
                  <label
                    htmlFor={passwordId}
                    className="block text-sm font-medium mb-2"
                  >
                    Password *
                  </label>
                  <Input
                    id={passwordId}
                    type="password"
                    {...register("password")}
                    disabled={isPending}
                    placeholder="Enter password (min. 8 characters)"
                  />
                  {errors.password && (
                    <p className="text-sm text-destructive mt-1">
                      {errors.password.message}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isPending}
              >
                Back
              </Button>
              <Button type="submit" disabled={isPending} className="flex-1">
                {isPending ? "Saving..." : "Continue to Shipping"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function CheckoutAddressLoading() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-8">Shipping Address</h1>
      <Card>
        <CardHeader>
          <CardTitle>Enter your shipping details</CardTitle>
          <CardDescription>
            We'll use this address to calculate shipping and deliver your order
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-10 bg-muted animate-pulse rounded" />
            <div className="h-10 bg-muted animate-pulse rounded" />
            <div className="grid md:grid-cols-2 gap-4">
              <div className="h-10 bg-muted animate-pulse rounded" />
              <div className="h-10 bg-muted animate-pulse rounded" />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="h-10 bg-muted animate-pulse rounded" />
              <div className="h-10 bg-muted animate-pulse rounded" />
            </div>
            <div className="flex gap-4 pt-4">
              <div className="h-10 bg-muted animate-pulse rounded flex-1" />
              <div className="h-10 bg-muted animate-pulse rounded flex-1" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function CheckoutAddressPage() {
  return (
    <Suspense fallback={<CheckoutAddressLoading />}>
      <CheckoutAddressForm />
    </Suspense>
  );
}
