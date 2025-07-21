import React, { useState } from 'react';
import axios from 'axios';

export default function BlogNew() {
    const [form, setForm] = useState({
        title: '',
        subtitle: '',
        template: '',
        image1: null,
        image1Alt: '',
        image2: null,
        image2Alt: '',
        image3: null,
        image3Alt: '',
        body1: '',
        body2: '',
        conclusion: ''
    });

    const handleChange = (e) => {
        const { name, files, value } = e.target;
        if (files && files.length > 0) {
            setForm({ ...form, [name]: files[0] });
        } else {
            setForm({ ...form, [name]: value });
        }
    };

    const uploadImage = async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', 'blog_uploads'); // 🔁 Replace with your Cloudinary preset
        const res = await axios.post('https://api.cloudinary.com/v1_1/drpebg9fi/image/upload', formData); // 🔁 Replace with your Cloudinary cloud name
        return res.data.secure_url;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const [img1, img2, img3] = await Promise.all([
                uploadImage(form.image1),
                uploadImage(form.image2),
                uploadImage(form.image3)
            ]);

            const payload = {
                title: form.title,
                subtitle: form.subtitle,
                template: form.template,
                image1: img1,
                image1Alt: form.image1Alt,
                image2: img2,
                image2Alt: form.image2Alt,
                image3: img3,
                image3Alt: form.image3Alt,
                body1: form.body1,
                body2: form.body2,
                conclusion: form.conclusion
            };

            const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/blogs`, payload);
            const slug = res.data?.blog?.slug || form.title.toLowerCase().replace(/\s+/g, '-');


            alert('Blog created and submitted to Google for indexing');
        } catch (error) {
            console.error('Error creating blog:', error);
            alert('Failed to create blog');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="p-6 max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-4">Create New Blog</h2>

            {[
                { name: 'title' },
                { name: 'subtitle' },
                { name: 'template' },
                { name: 'image1', type: 'file' },
                { name: 'image1Alt' },
                { name: 'image2', type: 'file' },
                { name: 'image2Alt' },
                { name: 'image3', type: 'file' },
                { name: 'image3Alt' },
                { name: 'body1' },
                { name: 'body2' },
                { name: 'conclusion' }
            ].map(({ name, type = 'text' }) => (
                <div key={name} className="mb-4">
                    <label className="block text-sm font-semibold mb-1 capitalize">
                        {name.replace(/([A-Z])/g, ' $1')}
                    </label>
                    <input
                        type={type}
                        name={name}
                        accept={type === 'file' ? 'image/*' : undefined}
                        onChange={handleChange}
                        className="w-full p-2 border rounded"
                    />
                </div>
            ))}

            <button
                type="submit"
                className="bg-blue-600 text-white py-2 px-4 w-full p-2 rounded hover:bg-blue-700"
            >
                Submit
            </button>
            <div className="h-[50px]" />
        </form>

    );
}
