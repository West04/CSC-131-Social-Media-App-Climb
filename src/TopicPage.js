import React, { useState, useEffect, useCallback } from 'react';
import { generateClient } from 'aws-amplify/api';
import { createPost } from './graphql/mutations';
import { GetTopicWithPosts } from './graphql/custom-queries';

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
            setTopic(topicData);
            setPosts(topicData.posts?.items || []);
            setLoading(false);
            setError(null); // Clear any previous errors
        } catch (error) {
            console.error("Error fetching topic and posts:", error);
            setError("Failed to load topic and posts. Please try again later.");
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
            setError(null); // Clear any previous errors
        } catch (error) {
            console.error("Error creating post:", error);
            setError("Failed to create post. Please try again.");
        }
    };

    if (loading) return <div>Loading topic and posts...</div>;
    if (error) return <div style={{ color: 'red' }}>{error}</div>;
    if (!topic) return <div>Topic not found.</div>;

    return (
        <div style={{ padding: '20px' }}>
            <button
                onClick={onBack}
                style={{
                    marginBottom: '20px',
                    padding: '8px 16px',
                    borderRadius: '4px',
                    border: '1px solid #ddd'
                }}
            >
                ← Back to Topics
            </button>

            <h1 style={{ marginBottom: '30px' }}>{topic.title}</h1>

            <div style={{
                backgroundColor: '#f5f5f5',
                padding: '20px',
                borderRadius: '8px',
                marginBottom: '30px'
            }}>
                <h2 style={{ marginBottom: '15px' }}>Create a Post</h2>
                <input
                    type="text"
                    value={newPostTitle}
                    onChange={(e) => setNewPostTitle(e.target.value)}
                    placeholder="Post title"
                    style={{
                        display: 'block',
                        width: '100%',
                        padding: '8px',
                        marginBottom: '10px',
                        borderRadius: '4px',
                        border: '1px solid #ddd'
                    }}
                />
                <textarea
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    placeholder="Post content"
                    style={{
                        display: 'block',
                        width: '100%',
                        padding: '8px',
                        marginBottom: '10px',
                        borderRadius: '4px',
                        border: '1px solid #ddd',
                        minHeight: '100px'
                    }}
                />
                <button
                    onClick={handleCreatePost}
                    style={{
                        padding: '8px 16px',
                        backgroundColor: '#4CAF50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}
                >
                    Create Post
                </button>
            </div>

            <h2>Posts</h2>
            {posts.length === 0 ? (
                <p style={{ color: '#666', fontStyle: 'italic' }}>
                    No posts yet. Be the first to create one!
                </p>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {posts.map((post) => (
                        <div
                            key={post.id}
                            style={{
                                backgroundColor: 'white',
                                padding: '20px',
                                borderRadius: '8px',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                            }}
                        >
                            <h3 style={{ marginBottom: '10px' }}>{post.title}</h3>
                            <p style={{ marginBottom: '10px' }}>{post.content}</p>
                            <div style={{
                                color: '#666',
                                fontSize: '0.9em',
                                display: 'flex',
                                justifyContent: 'space-between'
                            }}>
                                <span>By: {post.createdBy?.username || 'Anonymous'}</span>
                                <span>Likes: {post.likes}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default TopicPage;