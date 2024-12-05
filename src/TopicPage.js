import React, { useState, useEffect, useCallback } from 'react';
import { generateClient } from 'aws-amplify/api';
import { GetTopicWithPosts } from './graphql/custom-queries';
import { createPost, updatePost } from './graphql/mutations';
import './TopicPageNatureTheme.css';

const client = generateClient();

function TopicPage({ topicId, userId, onBack }) {
    const [topic, setTopic] = useState(null);
    const [newPost, setNewPost] = useState({
        title: '',
        content: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [postErrors, setPostErrors] = useState({
        title: '',
        content: ''
    });

    // Memoized fetch function to prevent unnecessary re-renders
    const fetchTopicDetails = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await client.graphql({
                query: GetTopicWithPosts,
                variables: { id: topicId }
            });

            setTopic(response.data.getTopic);
        } catch (err) {
            console.error('Error fetching topic details:', err);
            setError('Failed to load topic details. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    }, [topicId]);

    // Initial fetch and refetch mechanism
    useEffect(() => {
        fetchTopicDetails();
    }, [fetchTopicDetails]);

    const handlePostInputChange = (e) => {
        const { name, value } = e.target;
        setNewPost(prev => ({
            ...prev,
            [name]: value
        }));

        // Validate inputs
        if (name === 'title') {
            setPostErrors(prev => ({
                ...prev,
                title: value.trim().length < 3 ? 'Title must be at least 3 characters' : ''
            }));
        }

        if (name === 'content') {
            setPostErrors(prev => ({
                ...prev,
                content: value.trim().length < 10 ? 'Content must be at least 10 characters' : ''
            }));
        }
    };

    const handleCreatePost = async () => {
        // Validate all inputs before submission
        const titleError = !newPost.title.trim() ? 'Title is required' :
            (newPost.title.trim().length < 3 ? 'Title must be at least 3 characters' : '');
        const contentError = !newPost.content.trim() ? 'Content is required' :
            (newPost.content.trim().length < 10 ? 'Content must be at least 10 characters' : '');

        if (titleError || contentError) {
            setPostErrors({ title: titleError, content: contentError });
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            await client.graphql({
                query: createPost,
                variables: {
                    input: {
                        title: newPost.title.trim(),
                        content: newPost.content.trim(),
                        likes: 0,
                        createdByID: userId,
                        topicID: topicId
                    }
                }
            });

            // Reset post input and refresh topic details
            setNewPost({ title: '', content: '' });
            setPostErrors({ title: '', content: '' });
            await fetchTopicDetails();
        } catch (err) {
            console.error('Error creating post:', err);
            setError('Failed to create post. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleLikePost = async (postId, currentLikes) => {
        try {
            await client.graphql({
                query: updatePost,
                variables: {
                    input: {
                        id: postId,
                        likes: (currentLikes || 0) + 1
                    }
                }
            });

            // Optimistically update the likes
            setTopic(prevTopic => ({
                ...prevTopic,
                posts: {
                    ...prevTopic.posts,
                    items: prevTopic.posts.items.map(post =>
                        post.id === postId
                            ? { ...post, likes: (post.likes || 0) + 1 }
                            : post
                    )
                }
            }));
        } catch (err) {
            console.error('Error liking post:', err);
            setError('Failed to like post');
        }
    };

    if (isLoading) return <div className="loading-spinner">Loading...</div>;
    if (!topic) return null;

    return (
        <div className="topic-page">
            <button
                onClick={onBack}
                className="back-button"
                aria-label="Back to Topics"
            >
                ← Back to Topics
            </button>

            <h1>{topic.title}</h1>

            {error && <div className="error-banner">{error}</div>}

            {/* Post Creation Form */}
            <div className="create-post-section">
                <div className="input-group">
                    <input
                        type="text"
                        name="title"
                        placeholder="Post Title"
                        value={newPost.title}
                        onChange={handlePostInputChange}
                        className={`post-title-input ${postErrors.title ? 'input-error' : ''}`}
                    />
                    {postErrors.title && (
                        <span className="error-text">{postErrors.title}</span>
                    )}
                </div>
                <div className="input-group">
                    <textarea
                        name="content"
                        placeholder="Write your post..."
                        value={newPost.content}
                        onChange={handlePostInputChange}
                        className={`post-content-input ${postErrors.content ? 'input-error' : ''}`}
                    />
                    {postErrors.content && (
                        <span className="error-text">{postErrors.content}</span>
                    )}
                </div>
                <button
                    onClick={handleCreatePost}
                    disabled={isLoading}
                    className="create-post-button"
                >
                    {isLoading ? 'Posting...' : 'Create Post'}
                </button>
            </div>

            {/* Posts List */}
            <div className="posts-list">
                <h2>Posts</h2>
                {topic.posts.items.length === 0 ? (
                    <p className="no-posts-message">No posts yet. Be the first to post!</p>
                ) : (
                    topic.posts.items.map(post => (
                        <div key={post.id} className="post-item">
                            <h3>{post.title}</h3>
                            <p>{post.content}</p>
                            <div className="post-metadata">
                                <span>Posted by: {post.createdBy?.username || 'Anonymous'}</span>
                                <div className="post-actions">
                                    <button
                                        onClick={() => handleLikePost(post.id, post.likes)}
                                        className="like-button"
                                        aria-label="Like post"
                                    >
                                        👍 {post.likes || 0}
                                    </button>
                                    <span>{new Date(post.createdAt).toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

export default TopicPage;