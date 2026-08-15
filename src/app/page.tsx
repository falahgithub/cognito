"use client";

import { useState, useEffect } from "react";
import {
  signUp, confirmSignUp, signIn, signOut, getCurrentUser, fetchAuthSession,
  setUpTOTP, verifyTOTPSetup, updateMFAPreference, confirmSignIn,
  resetPassword, confirmResetPassword, updateUserAttributes,
} from "aws-amplify/auth";

type View = "menu" | "signup" | "confirm" | "login" | "mfa-setup" | "profile" | "forgot";

export default function Home() {
  const [view, setView] = useState<View>("menu");
  const [user, setUser] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [tenantId, setTenantId] = useState("");
  const [facilityId, setFacilityId] = useState("");
  const [role, setRole] = useState("admin");
  const [totpCode, setTotpCode] = useState("");
  const [totpSecret, setTotpSecret] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [pendingUser, setPendingUser] = useState("");

  useEffect(() => { checkUser(); }, []);

  async function checkUser() {
    try {
      const currentUser = await getCurrentUser();
      const authSession = await fetchAuthSession();
      setUser(currentUser);
      setSession(authSession);
      setView("profile");
    } catch {
      setUser(null);
      setView("menu");
    }
  }

  function showError(err: any) {
    setError(err?.message || String(err));
    setTimeout(() => setError(""), 5000);
  }

  function showMessage(msg: string) {
    setMessage(msg);
    setTimeout(() => setMessage(""), 5000);
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      const result = await signUp({
        username: email,
        password,
        options: {
          userAttributes: {
            email,
            "custom:tenant_id": tenantId,
            "custom:facility_id": facilityId,
            "custom:role": role,
          },
        },
      });
      setPendingUser(email);
      if (result.nextStep.signUpStep === "CONFIRM_SIGN_UP") {
        setView("confirm");
        showMessage("Check your email for the confirmation code");
      } else {
        showMessage("Sign up complete! Please sign in.");
        setView("login");
      }
    } catch (err) { showError(err); }
  }

  async function handleConfirm(e: React.FormEvent) {
    e.preventDefault();
    try {
      await confirmSignUp({ username: pendingUser, confirmationCode: code });
      showMessage("Email confirmed! You can now sign in.");
      setView("login");
    } catch (err) { showError(err); }
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      const result = await signIn({ username: email, password });
      if (result.nextStep.signInStep === "DONE") {
        await checkUser();
      } else if (result.nextStep.signInStep === "CONFIRM_SIGN_IN_WITH_TOTP_CODE") {
        setPendingUser(email);
        setView("mfa-setup");
        showMessage("Enter your TOTP code from your authenticator app");
      }
    } catch (err) { showError(err); }
  }

  async function startTOTPSetup() {
    try {
      const setup = await setUpTOTP();
      setTotpSecret(setup.getSetupUri("CognitoPractice").toString());
    } catch (err) { showError(err); }
  }

  async function handleVerifyTOTP(e: React.FormEvent) {
    e.preventDefault();
    try {
      await verifyTOTPSetup({ code: totpCode });
      await updateMFAPreference({ totp: "PREFERRED" });
      showMessage("MFA enabled successfully!");
      setTotpCode("");
      await checkUser();
    } catch (err) { showError(err); }
  }

  async function handleTOTPSignIn(e: React.FormEvent) {
    e.preventDefault();
    try {
      await confirmSignIn({ challengeResponse: totpCode });
      await checkUser();
    } catch (err) { showError(err); }
  }

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault();
    try {
      await resetPassword({ username: email });
      showMessage("Password reset code sent to email");
    } catch (err) { showError(err); }
  }

  async function handleConfirmForgot(e: React.FormEvent) {
    e.preventDefault();
    try {
      await confirmResetPassword({ username: email, confirmationCode: code, newPassword });
      showMessage("Password reset! Please sign in.");
      setView("login");
    } catch (err) { showError(err); }
  }

  async function handleUpdateAttr(e: React.FormEvent) {
    e.preventDefault();
    try {
      await updateUserAttributes({
        userAttributes: {
          "custom:tenant_id": tenantId,
          "custom:facility_id": facilityId,
          "custom:role": role,
        },
      });
      showMessage("Attributes updated!");
    } catch (err) { showError(err); }
  }

  async function handleSignOut() {
    await signOut();
    setUser(null);
    setSession(null);
    setView("menu");
  }

  if (view === "menu") {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold text-gray-900">Cognito Practice</h1>
        <p className="text-gray-600">Choose a flow to practice:</p>
        <div className="grid gap-3">
          <button onClick={() => setView("signup")} className="btn-primary">1. Sign Up (with custom attributes)</button>
          <button onClick={() => setView("login")} className="btn-primary">2. Sign In</button>
          <button onClick={() => setView("forgot")} className="btn-secondary">3. Forgot Password</button>
        </div>
      </div>
    );
  }

  if (view === "signup") {
    return (
      <form onSubmit={handleSignUp} className="space-y-4">
        <h2 className="text-2xl font-bold">Sign Up</h2>
        {error && <p className="text-red-600 bg-red-50 p-3 rounded">{error}</p>}
        <input type="email" placeholder="Email" required className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input type="password" placeholder="Password (12+ chars, mixed case, number, symbol)" required className="input" value={password} onChange={(e) => setPassword(e.target.value)} />
        <input type="text" placeholder="Tenant ID" required className="input" value={tenantId} onChange={(e) => setTenantId(e.target.value)} />
        <input type="text" placeholder="Facility ID" required className="input" value={facilityId} onChange={(e) => setFacilityId(e.target.value)} />
        <select className="input" value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="admin">Admin</option>
          <option value="user">User</option>
          <option value="manager">Manager</option>
        </select>
        <button type="submit" className="btn-primary w-full">Create Account</button>
        <button type="button" onClick={() => setView("menu")} className="text-sm text-gray-500 underline">Back</button>
      </form>
    );
  }

  if (view === "confirm") {
    return (
      <form onSubmit={handleConfirm} className="space-y-4">
        <h2 className="text-2xl font-bold">Confirm Email</h2>
        {message && <p className="text-green-700 bg-green-50 p-3 rounded">{message}</p>}
        <input type="text" placeholder="Verification code" required className="input" value={code} onChange={(e) => setCode(e.target.value)} />
        <button type="submit" className="btn-primary w-full">Verify</button>
        <button type="button" onClick={() => setView("menu")} className="text-sm text-gray-500 underline">Back</button>
      </form>
    );
  }

  if (view === "login") {
    return (
      <form onSubmit={handleSignIn} className="space-y-4">
        <h2 className="text-2xl font-bold">Sign In</h2>
        {error && <p className="text-red-600 bg-red-50 p-3 rounded">{error}</p>}
        <input type="email" placeholder="Email" required className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input type="password" placeholder="Password" required className="input" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button type="submit" className="btn-primary w-full">Sign In</button>
        <div className="flex justify-between text-sm">
          <button type="button" onClick={() => setView("forgot")} className="text-blue-600 underline">Forgot password?</button>
          <button type="button" onClick={() => setView("menu")} className="text-gray-500 underline">Back</button>
        </div>
      </form>
    );
  }

  if (view === "forgot") {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Reset Password</h2>
        {message && <p className="text-green-700 bg-green-50 p-3 rounded">{message}</p>}
        {error && <p className="text-red-600 bg-red-50 p-3 rounded">{error}</p>}
        <form onSubmit={handleForgot} className="space-y-3">
          <input type="email" placeholder="Email" required className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
          <button type="submit" className="btn-secondary w-full">Send Reset Code</button>
        </form>
        <form onSubmit={handleConfirmForgot} className="space-y-3 border-t pt-4">
          <input type="text" placeholder="Reset code" className="input" value={code} onChange={(e) => setCode(e.target.value)} />
          <input type="password" placeholder="New password" className="input" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          <button type="submit" className="btn-primary w-full">Reset Password</button>
        </form>
        <button onClick={() => setView("menu")} className="text-sm text-gray-500 underline">Back</button>
      </div>
    );
  }

  if (view === "mfa-setup") {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">MFA (TOTP)</h2>
        {error && <p className="text-red-600 bg-red-50 p-3 rounded">{error}</p>}
        {message && <p className="text-green-700 bg-green-50 p-3 rounded">{message}</p>}
        {!totpSecret ? (
          <>
            <p className="text-gray-600">Set up authenticator app (Google Authenticator, Authy, etc.)</p>
            <button onClick={startTOTPSetup} className="btn-primary">Generate QR Code</button>
          </>
        ) : (
          <>
            <p className="text-sm text-gray-600">Scan this URI in your app:</p>
            <code className="block bg-gray-100 p-2 rounded text-xs break-all">{totpSecret}</code>
            <form onSubmit={handleVerifyTOTP} className="space-y-3">
              <input type="text" placeholder="Enter 6-digit code" required className="input" value={totpCode} onChange={(e) => setTotpCode(e.target.value)} />
              <button type="submit" className="btn-primary w-full">Verify & Enable MFA</button>
            </form>
          </>
        )}
        <form onSubmit={handleTOTPSignIn} className="border-t pt-4 space-y-3">
          <p className="text-sm text-gray-500">Or enter TOTP code to complete sign-in:</p>
          <input type="text" placeholder="TOTP code" className="input" value={totpCode} onChange={(e) => setTotpCode(e.target.value)} />
          <button type="submit" className="btn-secondary w-full">Submit TOTP</button>
        </form>
        <button onClick={() => setView("menu")} className="text-sm text-gray-500 underline">Back</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Profile / Session</h2>
        <button onClick={handleSignOut} className="btn-danger">Sign Out</button>
      </div>
      {message && <p className="text-green-700 bg-green-50 p-3 rounded">{message}</p>}
      {error && <p className="text-red-600 bg-red-50 p-3 rounded">{error}</p>}
      <div className="bg-white shadow rounded-lg p-4 space-y-2">
        <h3 className="font-semibold text-gray-900">User</h3>
        <pre className="text-xs bg-gray-50 p-3 rounded overflow-auto">{JSON.stringify(user, null, 2)}</pre>
      </div>
      <div className="bg-white shadow rounded-lg p-4 space-y-2">
        <h3 className="font-semibold text-gray-900">Tokens</h3>
        <div className="space-y-2">
          <div>
            <span className="text-xs font-semibold text-gray-500">Access Token (first 100 chars)</span>
            <code className="block text-xs bg-gray-50 p-2 rounded break-all">
              {session?.tokens?.accessToken?.toString().slice(0, 100)}...
            </code>
          </div>
          <div>
            <span className="text-xs font-semibold text-gray-500">ID Token (first 100 chars)</span>
            <code className="block text-xs bg-gray-50 p-2 rounded break-all">
              {session?.tokens?.idToken?.toString().slice(0, 100)}...
            </code>
          </div>
        </div>
      </div>
      <div className="bg-white shadow rounded-lg p-4 space-y-3">
        <h3 className="font-semibold text-gray-900">Update Custom Attributes</h3>
        <form onSubmit={handleUpdateAttr} className="space-y-3">
          <input type="text" placeholder="Tenant ID" className="input" value={tenantId} onChange={(e) => setTenantId(e.target.value)} />
          <input type="text" placeholder="Facility ID" className="input" value={facilityId} onChange={(e) => setFacilityId(e.target.value)} />
          <select className="input" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="admin">Admin</option>
            <option value="user">User</option>
            <option value="manager">Manager</option>
          </select>
          <button type="submit" className="btn-secondary w-full">Update Attributes</button>
        </form>
      </div>
      <div className="bg-white shadow rounded-lg p-4 space-y-3">
        <h3 className="font-semibold text-gray-900">MFA</h3>
        <button onClick={() => { setView("mfa-setup"); startTOTPSetup(); }} className="btn-secondary w-full">Setup / Manage TOTP MFA</button>
      </div>
    </div>
  );
}
