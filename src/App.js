import React, { useState, useEffect, useReducer } from 'react';
import './App.css';
import { Authenticator, withAuthenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import awsExports from './aws-exports';
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/api';
import { createTopic } from "./graphql/mutations";
import { ListTopicsWithPosts } from "./graphql/custom-queries";
import TopicPage from './TopicPage';
import './TopicPageNatureTheme.css';


// Initialize Amplify
Amplify.configure(awsExports);
const client = generateClient();

// Initial state for the app
const initialState = {
    backgroundColor: '#f0f0f0',
    showHomeContent: false,
    showInitContent: true,
    topic: '',
    topics: [],
    selectedTopicId: null,
    error: null,
    isLoading: false
};

// Reducer function to manage complex state
function appReducer(state, action) {
    switch (action.type) {
        case 'SET_HOME_CONTENT':
            return {
                ...state,
                showHomeContent: action.payload,
                showInitContent: !action.payload
            };
        case 'SET_SELECTED_TOPIC':
            return {
                ...state,
                selectedTopicId: action.payload
            };
        case 'SET_TOPICS':
            return {
                ...state,
                topics: action.payload,
                error: null
            };
        case 'SET_ERROR':
            return {
                ...state,
                error: action.payload
            };
        case 'SET_LOADING':
            return {
                ...state,
                isLoading: action.payload
            };
        case 'SET_TOPIC_INPUT':
            return {
                ...state,
                topic: action.payload
            };
        case 'RESET_TOPIC_INPUT':
            return {
                ...state,
                topic: ''
            };
        default:
            return state;
    }
}

function App({ user, signOut }) {
    const [state, dispatch] = useReducer(appReducer, initialState);
    const [userId, setUserId] = useState("7f2c6cd3-82df-41a8-bc82-152538968f51");

    // Update user ID when authenticated
    useEffect(() => {
        if (user?.attributes?.sub) {
            const currentUserId = user.attributes.sub;
            setUserId(currentUserId);
            localStorage.setItem('userId', currentUserId);
        }
    }, [user]);

    // Fetch topics when home content is shown
    useEffect(() => {
        if (state.showHomeContent) {
            fetchTopics();
        }
    }, [state.showHomeContent]);

    // Update userId from local storage on initial load
    useEffect(() => {
        const storedUserId = localStorage.getItem('userId');
        if (storedUserId) {
            setUserId(storedUserId);
        }
    }, []);

    // Fetch topics from backend
    const fetchTopics = async () => {
        dispatch({ type: 'SET_LOADING', payload: true });
        dispatch({ type: 'SET_ERROR', payload: null });

        try {
            const topicData = await client.graphql({
                query: ListTopicsWithPosts
            });
            dispatch({
                type: 'SET_TOPICS',
                payload: topicData.data.listTopics.items
            });
        } catch (error) {
            console.error("Error fetching topics:", error);
            dispatch({
                type: 'SET_ERROR',
                payload: "Failed to load topics. Please try again later."
            });
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    };

    // Handlers for different page navigation
    const handleHomePageClick = () => {
        dispatch({ type: 'SET_HOME_CONTENT', payload: true });
        dispatch({ type: 'SET_SELECTED_TOPIC', payload: null });
    };

    const handleBackButtonClick = () => {
        dispatch({ type: 'SET_HOME_CONTENT', payload: false });
        dispatch({ type: 'SET_SELECTED_TOPIC', payload: null });
    };

    const handleInputChange = (event) => {
        dispatch({
            type: 'SET_TOPIC_INPUT',
            payload: event.target.value
        });
    };

    // Create new topic
    const handleCreateTopic = async () => {
        const trimmedTopic = state.topic.trim();

        if (trimmedTopic === '') {
            dispatch({
                type: 'SET_ERROR',
                payload: "Please enter a topic."
            });
            return;
        }

        dispatch({ type: 'SET_LOADING', payload: true });

        try {
            await client.graphql({
                query: createTopic,
                variables: { input: { title: trimmedTopic } }
            });

            dispatch({ type: 'RESET_TOPIC_INPUT' });
            dispatch({ type: 'SET_ERROR', payload: null });

            // Refetch topics to update list
            await fetchTopics();

            alert("Topic created successfully!");
        } catch (error) {
            console.error("Error creating topic:", error);
            dispatch({
                type: 'SET_ERROR',
                payload: "Failed to create topic. Please try again."
            });
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    };

    // Handle topic selection
    const handleTopicClick = (topicId) => {
        console.log("Selected Topic ID:", topicId);
        console.log("Current User ID:", userId);
        dispatch({ type: 'SET_SELECTED_TOPIC', payload: topicId });
    };

    return (
        <div className="App">
            <main>
                {state.showInitContent && (
                    <header className='App-header'>
                        {['Home Page', 'Followed Topics', 'For You', 'Your Posts'].map((buttonText) => (
                            <button
                                key={buttonText}
                                onClick={handleHomePageClick}
                                className="nav-button"
                            >
                                {buttonText}
                            </button>
                        ))}
                        <button
                            onClick={signOut}
                            className="nav-button sign-out"
                        >
                            Sign Out
                        </button>
                    </header>
                )}

                {state.showHomeContent && !state.selectedTopicId && (
                    <div className="home-content">
                        <div className="home-content-container">
                            {/* Left side - Topic Creation */}
                            <div className="topic-creation-section">
                                <label htmlFor="topicInput">Create New Topic</label>
                                <input
                                    id="topicInput"
                                    type="text"
                                    placeholder="Type your topic here..."
                                    value={state.topic}
                                    onChange={handleInputChange}
                                    className="topic-input"
                                />
                                <button
                                    onClick={handleCreateTopic}
                                    disabled={state.isLoading}
                                    className="create-topic-button"
                                >
                                    {state.isLoading ? 'Creating...' : 'Create Topic'}
                                </button>

                                <label htmlFor="postInput">Search</label>
                                <input
                                    id="postInput"
                                    type="text"
                                    placeholder="Type your search here..."
                                    className="search-input"
                                />
                            </div>

                            {/* Right side - Topics List */}
                            <div className="topics-list-section">
                                <h2>Popular Topics</h2>
                                {state.error && (
                                    <div className="error-message">{state.error}</div>
                                )}
                                {state.isLoading ? (
                                    <div className="loading-spinner">Loading...</div>
                                ) : (
                                    <div className="topics-grid">
                                        {state.topics.map((topic) => {
                                            const postCount = topic.posts?.items?.length || 0;
                                            return (
                                                <div
                                                    key={topic.id}
                                                    onClick={() => handleTopicClick(topic.id)}
                                                    className={`topic-item ${postCount === 0 ? 'empty-topic' : ''}`}
                                                >
                                                    <div className="topic-details">
                                                        <h3>{topic.title}</h3>
                                                        {postCount === 0 && (
                                                            <p className="no-posts-text">
                                                                No posts yet - Be the first to contribute!
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className={`post-count ${postCount === 0 ? 'empty' : 'active'}`}>
                                                        {postCount} {postCount === 1 ? 'post' : 'posts'}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>

                        <button
                            onClick={handleBackButtonClick}
                            className="back-button"
                        >
                            ← Back to Menu
                        </button>
                    </div>
                )}

                {state.selectedTopicId && userId && (
                    <TopicPage
                        topicId={state.selectedTopicId}
                        userId="6db1c7c5-17eb-4a87-a53b-29bfbce2eb11"
                        onBack={() => dispatch({ type: 'SET_SELECTED_TOPIC', payload: null })}
                    />
                )}
            </main>
        </div>
    );
}

export default withAuthenticator(App);
