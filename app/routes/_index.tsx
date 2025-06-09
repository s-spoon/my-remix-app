import type { Post, User } from "@prisma/client";
import {
  json,
  type LoaderFunction,
  type MetaFunction,
  type ActionFunction,
  redirect,
} from "@remix-run/node";
import { Form, useLoaderData, useSearchParams } from "@remix-run/react";
import {
  fetchPosts,
  createPost,
  updatePost,
  deletePost,
} from "prisma/helpers/post";
import { writeFile } from "fs/promises";
import path from "path";
import fs from "fs/promises";
import prisma from "lib/prisma";

export const meta: MetaFunction = () => {
  return [
    { title: "New Remix App" },
    { name: "description", content: "Welcome to Remix!" },
  ];
};

type PostWithUser = Post & { user: User };

type LoaderData = {
  posts: PostWithUser[];
};

export const loader: LoaderFunction = async () => {
  const posts = await fetchPosts();
  return json({ posts });
};

export const action: ActionFunction = async ({ request }) => {
  const form = await request.formData();
  const intent = form.get("_intent");
  const id = Number(form.get("id"));
  if (intent === "create") {
    const title = form.get("title")?.toString() || "";
    const content = form.get("content")?.toString() || null;
    const userName = form.get("userName")?.toString() || "Anonymous";

    let imageUrl: string | undefined;
    const image = form.get("image");

    if (image && typeof image === "object" && image.size > 0) {
      const buffer = Buffer.from(await image.arrayBuffer());
      const filename = `${Date.now()}-${image.name}`;
      const filepath = path.join("public/uploads", filename);
      await writeFile(filepath, buffer);
      imageUrl = `/uploads/${filename}`;
    }

    await createPost(title, content, userName, imageUrl);
    return redirect("/");
  } else if (intent === "update") {
    const title = form.get("title")?.toString() || "";
    const content = form.get("content")?.toString() || null;
    const userName = form.get("userName")?.toString() || "Anonymous";
    const removeImage = form.get("removeImage") === "on";

    const post = await prisma.post.findUnique({
      where: { id },
    });

    let imageUrl: string | undefined;

    const image = form.get("image");
    if (image && typeof image === "object" && image.size > 0) {
      const filename = `${Date.now()}-${image.name}`;
      const filepath = path.join("public/uploads", filename);
      const buffer = Buffer.from(await image.arrayBuffer());

      await writeFile(filepath, buffer);
      imageUrl = `/uploads/${filename}`;
    }

    if (removeImage && post?.imageUrl) {
      const oldFilename = post.imageUrl.split("/").pop();
      const oldPath = path.join("public/uploads", oldFilename!);
      try {
        await fs.unlink(oldPath);
      } catch (err) {
        console.error("Failed to delete image:", err);
      }
      imageUrl = undefined; // clear the imageUrl field in DB
    }

    await updatePost(id, title, content, userName, imageUrl ?? undefined);
  } else if (intent === "delete") {
    await deletePost(id);
  }

  return redirect("/");
};

export default function Index() {
  const { posts } = useLoaderData<LoaderData>();
  const [searchParams, setSearchParams] = useSearchParams();
  const editingId = Number(searchParams.get("editing"));

  return (
    <div className="flex justify-center items-center max-w-3xl mx-auto p-6 space-y-12">
      <div>
        <h2 className="text-2xl font-bold">New Journal Entry</h2>
        <Form
          method="post"
          encType="multipart/form-data"
          className="space-y-4 p-6 rounded shadow"
        >
          <input type="hidden" name="_intent" value="create" />
          <input
            name="userName"
            placeholder="Your name"
            required
            className="w-full p-2 border rounded"
            style={{ padding: "8px" }}
          />
          <input
            name="title"
            placeholder="Title"
            required
            className="w-full p-2 border rounded"
            style={{ marginTop: "10px", marginBottom: "10px", padding: "8px" }}
          />
          <textarea
            name="content"
            placeholder="Message"
            className="w-full p-2 border rounded"
            style={{ marginBottom: "10px", padding: "8px" }}
          />
          <input
            type="file"
            name="image"
            accept="image/*"
            className="w-full p-2 border rounded"
            style={{ marginBottom: "10px", padding: "8px" }}
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            style={{ padding: "8px" }}
          >
            Post
          </button>
        </Form>

        <h2 className="text-2xl font-bold">All Entries</h2>
        <ul className="space-y-6">
          {posts.map((post) => {
            const isEditing = editingId === post.id;
            return (
              <li key={post.id} className="bg-gray-100 p-4 rounded shadow">
                {isEditing ? (
                  <Form
                    method="post"
                    encType="multipart/form-data"
                    className="space-y-2"
                  >
                    <input type="hidden" name="id" value={post.id} />
                    <input type="hidden" name="_intent" value="update" />
                    <input
                      name="userName"
                      defaultValue={post.user?.name || ""}
                      placeholder="Your name"
                      required
                      className="w-full p-2 border rounded"
                      style={{
                        marginTop: "10px",
                        marginBottom: "10px",
                        padding: "8px",
                      }}
                    />
                    <input
                      name="title"
                      defaultValue={post.title}
                      required
                      className="w-full p-2 border rounded"
                      style={{
                        marginBottom: "10px",
                        padding: "8px",
                      }}
                    />
                    <textarea
                      name="content"
                      defaultValue={post.content || ""}
                      className="w-full p-2 border rounded"
                      style={{ marginBottom: "10px", padding: "8px" }}
                    />
                    {post.imageUrl && (
                      <div className="flex items-center">
                        <img
                          src={post.imageUrl}
                          alt="Uploaded"
                          style={{
                            width: "100%",
                            maxWidth: "6rem",
                            height: "auto",
                            marginBottom: "0.5rem",
                            borderRadius: "0.25rem",
                            marginRight: "1rem",
                          }}
                        />
                        <div>
                          <p className="text-sm text-gray-600 mb-1">
                            Current image:{" "}
                            <span className="font-medium">
                              {post.imageUrl.split("/").pop()}
                            </span>
                          </p>
                          {/* <label className="text-sm text-red-600 block mb-2">
                            <input
                              type="checkbox"
                              name="removeImage"
                              className="mr-2"
                            />
                            Remove image
                          </label> */}
                        </div>
                      </div>
                    )}
                    <input
                      type="file"
                      name="image"
                      accept="image/*"
                      className="w-full p-2 border rounded"
                      style={{ marginBottom: "10px", padding: "8px" }}
                    />
                    <div className="flex space-x-2">
                      <button
                        type="submit"
                        className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                        style={{ marginRight: "10px", padding: "8px" }}
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setSearchParams({})}
                        className="bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600"
                        style={{ padding: "8px" }}
                      >
                        Cancel
                      </button>
                    </div>
                  </Form>
                ) : (
                  <>
                    <h3 className="text-lg font-semibold">{post.title}</h3>
                    <div className="flex">
                      {post.imageUrl && (
                        <img
                          src={post.imageUrl}
                          alt="Journal image"
                          style={{
                            width: "100%",
                            maxWidth: "6rem",
                            height: "auto",
                            marginBottom: "1rem",
                            borderRadius: "0.25rem",
                            marginRight: "1rem",
                          }}
                        />
                      )}
                      <div className="flex items-center">
                        <div>
                          <p
                            className="text-gray-700"
                            style={{ marginTop: "0px" }}
                          >
                            {post.content}
                          </p>
                          <p className="text-sm text-gray-500">
                            by {post.user?.name ?? "Unknown"} at{" "}
                            {new Date(post.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setSearchParams({ editing: post.id.toString() })
                        }
                        className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
                        style={{ marginRight: "10px", padding: "8px" }}
                      >
                        Update
                      </button>
                      <Form method="post">
                        <input type="hidden" name="id" value={post.id} />
                        <button
                          type="submit"
                          name="_intent"
                          value="delete"
                          className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                          style={{ padding: "8px" }}
                        >
                          Delete
                        </button>
                      </Form>
                    </div>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
