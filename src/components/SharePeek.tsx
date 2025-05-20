import { useState, type ChangeEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "../supabase-client";

interface PostInput {
    title: string;
    content: string;
}
const sharePeek = async (post: PostInput, imageFile: File ) => {
    
    
    const filePath = `${post.title}-${Date.now()}-${imageFile.name}`

    const {error: uploadError} = await supabase.storage.from("peeks").upload(filePath, imageFile)

    if (uploadError) throw new Error(uploadError.message);
 
    const {data: publicURLData} = supabase.storage.from("peeks").getPublicUrl(filePath)

    const {data, error} = await supabase.from("Peeks").insert({...post, image_url: publicURLData.publicUrl});

    if (error) throw new Error(error.message);
    
        return data;
}


export const SharePeek = () => {
    const [title, setTitle] = useState<string>("");
    const [content, setContent] = useState<string>("");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const {mutate} = useMutation({mutationFn:(data: {post: PostInput, imageFile: File}) => {
        return sharePeek(data.post, data.imageFile);

    }})

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        if (!selectedFile) return;
        mutate({post : {title, content}, imageFile: selectedFile})
    };

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);

        }
    }

    return ( 
    <form onSubmit={handleSubmit}> 
        {" "}
        <div>
            {" "} 
            <label>
                Title
            </label>
            <input type="text" id="title" required onChange={(event =>setTitle(event.target.value))}/>
        </div>
        <div>
            {" "}  
            <label>
                Content
            </label>
            <textarea id="content" required rows={5}
            onChange={(event =>setContent(event.target.value))}
            />
        </div>

        <div>
            {" "}  
            <label>
                Upload Image
            </label>
            <input
            type="file"
            id="image"
            accept="image/*" 
            required 
            onChange={handleFileChange}
            />
        </div>

        <button type="submit"> Share Peek </button>
    </form>
    );
}