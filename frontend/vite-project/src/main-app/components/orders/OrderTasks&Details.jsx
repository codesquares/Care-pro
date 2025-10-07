import { useState} from "react";
import "./Order&Tasks.scss";

const MyOrders = () => {
    const [selectedView, setSelectedView] = useState("Tasks");
    const [orders, setOrders] = useState([
        {
            id: "F02CF3B9865",
            title: "House Cleaning",
            description: "I will clean your house and do laundry for ₦2,000 per hour.",
            price: "₦30,000",
            status: "In Progress",
            tasks: [
                {
                    text: "Help with physical therapy exercises or encourage light exercise like walking.",
                    completed: false,
                    date: "12/07/2024",
                },
                {
                    text: "Help with physical therapy exercises or encourage light exercise like walking.",
                    completed: false,
                    date: "12/08/2024",
                },
                {
                    text: "Keep track of Mr. Ader's medication schedule and provide gentle reminders to take his pills at the right times.",
                    completed: true,
                    date: "12/08/2024",
                },
                {
                    text: "Keep track of Mr. Ader's medication schedule and provide gentle reminders to take his pills at the right times.",
                    completed: true,
                    date: "12/09/2024",
                },
            ],
            provider: "Ahmed Rufai",
            providerRating: 4.5,
            providerLocation: "Yaba, Lagos",
            date: "12/08/2024",
        },
    ]);

    return (
        <div className="my-orders-container">
            {/* <Navbar />  This was here but it kept causing issues so I left it out for now*/}
            <div className="tab-navigation">
                {["Tasks", "Details"].map((tab) => (
                    <button
                        key={tab}
                        className={`tab-button ${selectedView === tab ? "active" : ""}`}
                        onClick={() => setSelectedView(tab)}
                    >
                        {tab}
                        {selectedView === tab && <span className="underline"></span>}
                    </button>
                ))}
            </div>
            <div className="order-tasks-wrapper">
                <div className="content-wrapper">
                    {selectedView === "Tasks" ? (
                        <div className="tasks-section">
                            <h2>Tasks</h2>
                            {orders.map((order, index) => (
                                <div key={index} className="task-item">
                                    <div className="task-details">
                                        {order.tasks.map((task, taskIndex) => (
                                            <div
                                                key={taskIndex}
                                                className={`task ${task.completed ? "completed" : ""}`}
                                            >
                                                {task.completed ? "✔" : "☐"} {task.text}
                                                <span className="task-date">{task.date}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="details-section">
                            <div className="offer-header">
                                <img
                                    src="https://via.placeholder.com/50"
                                    alt={orders[0].provider}
                                    className="provider-avatar"
                                />
                                <h2>Offer from {orders[0].provider}</h2>
                                <div className="provider-info">
                                    Available ★ {orders[0].providerRating} (0) • {orders[0].providerLocation}
                                </div>
                            </div>
                            <div className="offer-content">
                                <select className="offer-category">
                                    <option>Children Care</option>
                                    <option>Prenatal Care</option>
                                </select>
                                <textarea
                                    className="offer-responsibilities"
                                    placeholder="Take care of my wife's pre-natal and post-natal care and general home care: cooking, laundry, and miscellaneous..."
                                ></textarea>
                                <div className="tasks-section">
                                    <p>Tasks</p>
                                    {orders.map((order, index) => (
                                        <div key={index} className="task-item">
                                        <div className="task-details">
                                            {order.tasks
                                                .filter((task) => !task.completed) // Filter to only show incomplete tasks
                                                .map((task, taskIndex) => (
                                                    <div key={taskIndex} className="task">
                                                        ☐ {task.text}
                                                        <span className="task-date">{task.date}</span>
                                                    </div>
                                                ))}
                                        </div>
                                    </div>                                    
                                    ))}
                                    <p>Pricing</p>
                                    <input type="text" className="offer-pricing" placeholder="₦3,000,000" />
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="right-section">
                        <div className="order-details-section">
                            <h2>Order Details</h2>
                            {orders.map((order, index) => (
                                <div key={index} className="order-card">
                                    <img src="https://via.placeholder.com/100" alt="Order activity" className="order-image" />
                                    <p>{order.description}</p>
                                    <div className="order-status-badge">* {order.status}</div>
                                    <div className="order-meta">
                                        <p>Ordered from: {order.provider}</p>
                                        <p>Total price: {order.price}</p>
                                        <p>Order number: #{order.id}</p>
                                    </div>
                                    <button className="mark-completed-btn">Mark as Completed</button>
                                    <button className="report-issue-btn">Dispute Order</button>
                                </div>
                            ))}
                        </div>

                        <div className="support-section">
                            <h3>Support</h3>
                            <div className="support-item">
                                <a href = "http://localhost:5173/order-faq">📋 FAQs</a>
                                <span>Find needed answers</span>
                            </div>
                            <div className="support-item">
                                <a href = "http://localhost:5173/ResolutionCenter">📞 Resolution Center</a>
                                <span>Resolve order issues</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MyOrders;