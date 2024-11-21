import React, { useState, useEffect, useCallback } from 'react';
import { generateClient } from 'aws-amplify/api';
import { createPost } from './graphql/mutations';
import { GetTopicWithPosts, ListTopicsWithPosts} from './graphql/custom-queries';

const client = generateClient();

function TopicPage({ topicId, onBack, userId }) {
    const [topic, setTopic] = useState(null);
    const [posts, setPosts] = useState([]);
    const [newPostTitle, setNewPostTitle] = useState('');
    const [newPostContent, setNewPostContent] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);


    const fetchTopicAndPosts = useCallback(async () => {
        try {
            const response = await client.graphql({
                query: GetTopicWithPosts,
                variables: { id: topicId },
            });
            const topicData = response.data.getTopic;
            console.log("Fetched topic:", topicData); // Debugging
            setTopic(topicData);
            setPosts(topicData.posts?.items || []);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching topic and posts:", error);
            setError(error.message);
            setLoading(false);
        }
    }, [topicId]);

    useEffect(() => {
        fetchTopicAndPosts();
    }, [fetchTopicAndPosts]);

    const handleCreatePost = async () => {
        if (newPostTitle.trim() === '' || newPostContent.trim() === '') {
            alert("Please enter both a title and content for your post.");
            return;
        }

        try {
            await client.graphql({
                query: createPost,
                variables: {
                    input: {
                        title: newPostTitle,
                        content: newPostContent,
                        likes: 0,
                        createdByID: userId,
                        topicID: topicId,
                    },
                },
            });

            setNewPostTitle('');
            setNewPostContent('');
            fetchTopicAndPosts();
        } catch (error) {
            console.error("Error creating post:", error);
            alert("There was an error creating the post. Please try again.");
        }
    };


    if (loading) return <div>Loading topic and posts...</div>;
    if (!topic) return <div>Topic not found.</div>;

    return (
        <div>
            <button onClick={onBack}>← Back to Topics</button>
            <h1>{topic.title}</h1>
            <div>
                <h2>Create a Post</h2>
                <input
                    type="text"
                    value={newPostTitle}
                    onChange={(e) => setNewPostTitle(e.target.value)}
                    placeholder="Post title"
                />
                <textarea
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    placeholder="Post content"
                />
                <button onClick={handleCreatePost}>Create Post</button>
            </div>
            <h2>Posts</h2>
            {posts.length === 0 ? (
                <p>No posts yet. Be the first to create one!</p>
            ) : (
                posts.map((post) => (
                    <div key={post.id}>
                        <h3>{post.title}</h3>
                        <p>{post.content}</p>
                        <p>Likes: {post.likes}</p>
                    </div>
                ))
            )}
        </div>
    );
}

export default TopicPage;
