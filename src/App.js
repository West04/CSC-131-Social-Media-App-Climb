import React, { useState, useEffect } from 'react';
import './App.css';
import { Authenticator, withAuthenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import awsExports from './aws-exports';
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/api';
import { createTopic } from "./graphql/mutations";
import { listTopics } from "./graphql/queries";
import { ListTopicsWithPosts } from './graphql/custom-queries';

import TopicPage from './TopicPage';

Amplify.configure(awsExports);
const client = generateClient();

function App() {
    const [backgroundColor, setBackgroundColor] = useState('#f0f0f0');
    const [showHomeContent, setShowHomeContent] = useState(false);
    const [showInitContent, setShowInitContent] = useState(true);
    const [topic, setTopic] = useState('');
    const [topics, setTopics] = useState([]);
    const [selectedTopicId, setSelectedTopicId] = useState(null);

    useEffect(() => {
        if (showHomeContent) {
            fetchTopics();
        }
    }, [showHomeContent]);

    const fetchTopics = async () => {
        try {
            const topicData = await client.graphql({
                query: listTopics
            });
            setTopics(topicData.data.listTopics.items);
        } catch (error) {
            console.error("Error fetching topics:", error);
        }
    };

    const handleHomePageClick = () => {
        setBackgroundColor('#008000');
        setShowHomeContent(true);
        setShowInitContent(false);
        setSelectedTopicId(null);
    };

    const handleBackButtonClick = () => {
        setShowHomeContent(false);
        setShowInitContent(true);
        setSelectedTopicId(null);
    };

    const handleInputChange = (event) => {
        setTopic(event.target.value);
    };

    const handleCreateTopic = async () => {
        if (topic.trim() === '') {
            alert("Please enter a topic.");
            return;
        }

        const topicInput = {
            title: topic,
        };

        try {
            const response = await client.graphql({
                query: createTopic,
                variables: { input: topicInput }
            });
            alert("Topic created successfully!");
            setTopic('');
            fetchTopics();
        } catch (error) {
            console.error("Error creating topic:", error);
            alert("There was an error creating the topic. Please try again.");
        }
    };

    const handleTopicClick = (topicId) => {
        setSelectedTopicId(topicId);
    };

    return (
        <div className="App">
            <Authenticator>
                {({ signOut, user }) => {
                    // Ensure user exists and has required attributes
                    const userId = user?.attributes?.sub;

                    return (
                        <main>
                            {showInitContent && (
                                <header className='App-header'>
                                    <button
                                        onClick={handleHomePageClick}
                                        style={{
                                            padding: '10px',
                                            backgroundColor: '#f0f0f0',
                                            border: '1px solid #ddd',
                                            borderRadius: '5px',
                                            width: '200px',
                                            margin: '20px auto',
                                            fontSize: '20px',
                                            fontWeight: 'bold',
                                            color: "black",
                                            textAlign: 'center'
                                        }}>
                                        Home Page
                                    </button>
                                    <button onClick={signOut} style={{
                                        margin: '20px',
                                        fontSize: '0.8rem',
                                        padding: '5px 10px',
                                        marginTop: '20px'
                                    }}>
                                        Sign Out
                                    </button>
                                </header>
                            )}

                            {showHomeContent && !selectedTopicId && (
                                <div style={{ height: '100vh', backgroundColor: '#008000' }}>
                                    {/* ... rest of your home content code ... */}
                                    <div style={{
                                        display: 'flex',
                                        padding: '20px',
                                        height: '100%',
                                    }}>
                                        {/* Left side - Topic Creation */}
                                        <div style={{
                                            flex: '1',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            padding: '20px',
                                        }}>
                                            <label htmlFor="topicInput">Create New Topic</label>
                                            <input
                                                id="topicInput"
                                                type="text"
                                                placeholder="Type your topic here..."
                                                value={topic}
                                                onChange={handleInputChange}
                                                style={{
                                                    width: '300px',
                                                    height: '100px',
                                                    backgroundColor: '#ffffff',
                                                    margin: '20px auto',
                                                    textAlign: 'center',
                                                    borderRadius: '5px',
                                                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                                                    padding: '10px'
                                                }}
                                            />
                                            <button
                                                onClick={handleCreateTopic}
                                                style={{
                                                    margin: '20px',
                                                    fontSize: '0.8rem',
                                                    padding: '5px 10px',
                                                }}>
                                                Create Topic
                                            </button>

                                            <label htmlFor="postInput">Search</label>
                                            <input
                                                id="postInput"
                                                type="text"
                                                placeholder="Type your search here..."
                                                style={{
                                                    width: '300px',
                                                    height: '100px',
                                                    backgroundColor: '#ffffff',
                                                    margin: '20px auto',
                                                    textAlign: 'center',
                                                    borderRadius: '5px',
                                                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                                                    padding: '10px'
                                                }}
                                            />
                                        </div>

                                        {/* Right side - Topics List */}
                                        <div style={{
                                            flex: '1',
                                            backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                            borderRadius: '10px',
                                            padding: '20px',
                                            margin: '20px',
                                            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                                            overflowY: 'auto',
                                        }}>
                                            <h2 style={{ textAlign: 'center', color: '#333' }}>Popular Topics</h2>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                {topics.map((topic) => {
                                                    const postCount = topic.posts?.items?.length || 0;
                                                    return (
                                                        <div
                                                            key={topic.id}
                                                            onClick={() => handleTopicClick(topic.id)}
                                                            style={{
                                                                backgroundColor: '#ffffff',
                                                                padding: '15px',
                                                                borderRadius: '5px',
                                                                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
                                                                cursor: 'pointer',
                                                                transition: 'transform 0.2s',
                                                                border: postCount === 0 ? '1px dashed #ccc' : '1px solid #eee',
                                                                display: 'flex',
                                                                justifyContent: 'space-between',
                                                                alignItems: 'center'
                                                            }}>
                                                            <div>
                                                                <h3 style={{ margin: '0', color: '#333' }}>{topic.title}</h3>
                                                                {postCount === 0 && (
                                                                    <p style={{
                                                                        margin: '5px 0 0 0',
                                                                        color: '#666',
                                                                        fontSize: '0.9em',
                                                                        fontStyle: 'italic'
                                                                    }}>
                                                                        No posts yet - Be the first to contribute!
                                                                    </p>
                                                                )}
                                                            </div>
                                                            <div style={{
                                                                backgroundColor: postCount === 0 ? '#f5f5f5' : '#e8f5e9',
                                                                color: postCount === 0 ? '#666' : '#2e7d32',
                                                                padding: '4px 8px',
                                                                borderRadius: '12px',
                                                                fontSize: '0.9em',
                                                                fontWeight: 'bold'
                                                            }}>
                                                                {postCount} {postCount === 1 ? 'post' : 'posts'}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleBackButtonClick}
                                        style={{
                                            position: 'fixed',
                                            bottom: '20px',
                                            left: '20px',
                                            fontSize: '0.8rem',
                                            padding: '5px 10px',
                                        }}>
                                        Back
                                    </button>
                                </div>
                            )}

                            {selectedTopicId && userId && (
                                <TopicPage
                                    topicId={selectedTopicId}
                                    userId={userId}
                                    onBack={() => setSelectedTopicId(null)}
                                />
                            )}
                        </main>
                    );
                }}
            </Authenticator>
        </div>
    );
}

export default withAuthenticator(App);