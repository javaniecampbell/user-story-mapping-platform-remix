// app/utils/auth.server.ts
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { createCookieSessionStorage, redirect } from "@remix-run/node";
import { db } from "./db.server";

type LoginForm = {
  email: string;
  password: string;
};

function comparePasswordInline(password: string, hash: string) {
  const [salt, key] = hash.split("$");
  const newKey = crypto
    .pbkdf2Sync(password, salt, 1000, 64, "sha512")
    .toString("hex");
  return key === newKey;
}

function comarePassword(password: string, salt: string, hash: string) {
  const newKey = crypto
    .pbkdf2Sync(password, salt, 1000, 64, "sha512")
    .toString("hex");
  return hash === newKey;
}

export async function register({ email, password }: LoginForm) {
  // const passwordHash = await bcrypt.hash(password, 10);
  let salt = crypto.randomBytes(16).toString("hex");
  let fastHash = crypto
    .pbkdf2Sync(password, salt, 1, 64, "sha256")
    .toString("hex"); // faster but less secure
  // let slowHash = crypto
  //   .pbkdf2Sync(password, salt, 1000, 64, "sha512")
  //   .toString("hex"); // more secure but slower
  // let passwordHash = salt + "$" + fastHash;
  const user = await db.user.create({
    data: {
      email,
      // password: passwordHash
      password: {
        create: {
          salt: salt,
          hash: fastHash,
        }
      }

    },
  });
  return { id: user.id, email };
}

export async function login({ email, password }: LoginForm) {
  const user = await db.user.findUnique({
    where: { email },
    include: {
      password: true
    }
  });
  if (!user) return null;

if(!user.password) return null;

  // const isCorrectPassword = comparePasswordInline(password, user.password)

  // const isCorrectPassword = await bcrypt.compare(password, user.password);
  const isCorrectPassword = comarePassword(password, user.password.salt, user.password.hash);
  if (!isCorrectPassword) return null;
  return { id: user.id, email };
}

const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret) {
  throw new Error("SESSION_SECRET must be set");
}

const storage = createCookieSessionStorage({
  cookie: {
    name: "RJ_session",
    secure: process.env.NODE_ENV === "production",
    secrets: [sessionSecret],
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    httpOnly: true,
  },
});

export async function createUserSession(userId: string, redirectTo: string) {
  const session = await storage.getSession();
  session.set("userId", userId);
  return redirect(redirectTo, {
    headers: {
      "Set-Cookie": await storage.commitSession(session),
    },
  });
}

export function getUserSession(request: Request) {
  return storage.getSession(request.headers.get("Cookie"));
}

export async function getUserId(request: Request) {
  const session = await getUserSession(request);
  const userId = session.get("userId");
  if (!userId || typeof userId !== "string") return null;
  return userId;
}

export async function requireUserId(
  request: Request,
  redirectTo: string = new URL(request.url).pathname
) {
  const session = await getUserSession(request);
  const userId = session.get("userId");
  if (!userId || typeof userId !== "string") {
    const searchParams = new URLSearchParams([["redirectTo", redirectTo]]);
    throw redirect(`/login?${searchParams}`);
  }
  return userId;
}

export async function getUser(request: Request) {
  const userId = await getUserId(request);
  if (typeof userId !== "string") {
    return null;
  }

  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true },
    });
    return user;
  } catch {
    throw logout(request);
  }
}

export async function logout(request: Request) {
  const session = await getUserSession(request);
  return redirect("/", {
    headers: {
      "Set-Cookie": await storage.destroySession(session),
    },
  });
}