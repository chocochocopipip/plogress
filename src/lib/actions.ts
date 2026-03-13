"use server";

import { createClient } from "@/lib/supabase/server";
import { generateId } from "@/lib/entries";
import { uploadFile, deleteFile, deleteFolder } from "@/lib/r2";
import { revalidatePath } from "next/cache";

async function getAuthUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  return { supabase, user };
}

export async function createEntryAction(formData: FormData) {
  const { supabase, user } = await getAuthUser();

  const id = generateId();
  const date = formData.get("date") as string;
  const text = formData.get("text") as string;
  const featuredImage = formData.get("featuredImage") as string;
  const imageFiles = formData.getAll("images") as File[];

  const imageNames: string[] = [];

  for (const file of imageFiles) {
    if (!file.size) continue;
    const bytes = await file.arrayBuffer();
    await uploadFile(`${user.id}/${id}/${file.name}`, bytes, file.type);
    imageNames.push(file.name);
  }

  const isPublic = formData.get("isPublic") !== "false";

  const { error } = await supabase.from("entries").insert({
    id,
    user_id: user.id,
    date,
    text,
    featured_image: featuredImage,
    images: imageNames,
    is_public: isPublic,
  });

  if (error) throw error;

  revalidatePath("/");
}

export async function updateEntryAction(id: string, formData: FormData) {
  const { supabase, user } = await getAuthUser();

  const { data: entry } = await supabase
    .from("entries")
    .select("user_id, images")
    .eq("id", id)
    .single();

  if (!entry || entry.user_id !== user.id) throw new Error("Forbidden");

  const date = formData.get("date") as string;
  const text = formData.get("text") as string;
  const featuredImage = formData.get("featuredImage") as string;
  const imageFiles = formData.getAll("images") as File[];
  const keepImages: string[] = JSON.parse(
    (formData.get("keepImages") as string) || "[]"
  );

  // Upload new images to R2
  const newImageNames: string[] = [];
  for (const file of imageFiles) {
    if (!file.size) continue;
    const bytes = await file.arrayBuffer();
    await uploadFile(`${user.id}/${id}/${file.name}`, bytes, file.type);
    newImageNames.push(file.name);
  }

  // Delete removed images from R2
  const allNewImages = [...keepImages, ...newImageNames];
  const removedImages = (entry.images || []).filter(
    (img: string) => !allNewImages.includes(img)
  );
  for (const img of removedImages) {
    await deleteFile(`${user.id}/${id}/${img}`);
  }

  // Use imageOrder to preserve drag-and-drop order
  const imageOrderRaw = formData.get("imageOrder") as string | null;
  let orderedImages: string[];
  if (imageOrderRaw) {
    const imageOrder: string[] = JSON.parse(imageOrderRaw);
    // Only keep names that are in allNewImages (valid)
    orderedImages = imageOrder.filter((name) => allNewImages.includes(name));
  } else {
    orderedImages = allNewImages;
  }

  const isPublic = formData.get("isPublic") !== "false";

  const { error } = await supabase
    .from("entries")
    .update({
      date,
      text,
      featured_image: featuredImage,
      images: orderedImages,
      is_public: isPublic,
    })
    .eq("id", id);

  if (error) throw error;

  revalidatePath("/");
}

export async function deleteEntryAction(id: string) {
  const { supabase, user } = await getAuthUser();

  const { data: entry } = await supabase
    .from("entries")
    .select("user_id")
    .eq("id", id)
    .single();

  if (!entry || entry.user_id !== user.id) throw new Error("Forbidden");

  // Delete all images from R2
  await deleteFolder(`${user.id}/${id}/`);

  const { error } = await supabase.from("entries").delete().eq("id", id);
  if (error) throw error;

  revalidatePath("/");
}

export async function setFeaturedImageAction(id: string, imageName: string) {
  const { supabase, user } = await getAuthUser();

  const { data: entry } = await supabase
    .from("entries")
    .select("user_id")
    .eq("id", id)
    .single();

  if (!entry || entry.user_id !== user.id) throw new Error("Forbidden");

  const { error } = await supabase
    .from("entries")
    .update({ featured_image: imageName })
    .eq("id", id);

  if (error) throw error;
  revalidatePath("/");
}

export async function toggleLikeAction(entryId: string) {
  const { supabase, user } = await getAuthUser();

  const { data: existing } = await supabase
    .from("likes")
    .select("entry_id")
    .eq("entry_id", entryId)
    .eq("user_id", user.id)
    .single();

  if (existing) {
    await supabase
      .from("likes")
      .delete()
      .eq("entry_id", entryId)
      .eq("user_id", user.id);
  } else {
    await supabase
      .from("likes")
      .insert({ entry_id: entryId, user_id: user.id });
  }

  revalidatePath("/");
}

export async function addCommentAction(entryId: string, body: string) {
  const { supabase, user } = await getAuthUser();

  const { error } = await supabase.from("comments").insert({
    entry_id: entryId,
    user_id: user.id,
    body,
  });

  if (error) throw error;
  revalidatePath("/");
}

export async function deleteCommentAction(commentId: string) {
  const { supabase, user } = await getAuthUser();

  const { data: comment } = await supabase
    .from("comments")
    .select("user_id")
    .eq("id", commentId)
    .single();

  if (!comment || comment.user_id !== user.id) throw new Error("Forbidden");

  const { error } = await supabase
    .from("comments")
    .delete()
    .eq("id", commentId);

  if (error) throw error;
  revalidatePath("/");
}

export async function updateBioAction(bio: string) {
  const { supabase, user } = await getAuthUser();

  const { error } = await supabase
    .from("profiles")
    .update({ bio: bio.slice(0, 240) })
    .eq("id", user.id);

  if (error) throw error;
}
