import prisma from "../../lib/prisma";

export const fetchPosts = async () => {
  return await prisma.post.findMany({
    include: { user: true },
    orderBy: { createdAt: "desc" },
  });
};

export const fetchPostsByUser = async (name: string) => {
  return await prisma.post.findMany({
    where: { user: { name } },
    include: { user: true },
    orderBy: { createdAt: "desc" },
  });
};

export const createPost = async (
  title: string,
  content: string | null,
  userName: string,
  imageUrl?: string
) => {
  const user = await prisma.user.upsert({
    where: { name: userName },
    update: {},
    create: { name: userName },
  });

  return await prisma.post.create({
    data: { title, content, imageUrl, userId: user.id },
  });
};

export const updatePost = async (
  id: number,
  title: string,
  content: string | null,
  userName: string,
  imageUrl?: string
) => {
  const post = await prisma.post.findUnique({
    where: { id },
    include: { user: true },
  });

  if (!post) throw new Error("Post not found");

  let user = post.user;
  if (user.name !== userName) {
    user = await prisma.user.upsert({
      where: { name: userName },
      update: {},
      create: { name: userName },
    });
  }

  return await prisma.post.update({
    where: { id },
    data: {
      title,
      content,
      userId: user.id,
      ...(imageUrl && { imageUrl }),
    },
  });
};

export const deletePost = async (id: number) => {
  return await prisma.post.delete({
    where: { id },
  });
};
