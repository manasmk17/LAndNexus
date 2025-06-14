
async function testMessaging() {
  try {
    console.log("Testing messaging functionality...");
    
    // Test message creation
    const testMessage = {
      senderId: 10, // Professional user Manas
      receiverId: 26, // Company user
      content: "Hello, this is a test message!"
    };
    
    const response = await fetch("http://localhost:5000/api/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(testMessage)
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log("✅ Message created successfully:", result);
    } else {
      console.log("❌ Message creation failed:", response.status, await response.text());
    }
    
    // Test message retrieval
    const getResponse = await fetch("http://localhost:5000/api/messages", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      }
    });
    
    if (getResponse.ok) {
      const messages = await getResponse.json();
      console.log("✅ Messages retrieved successfully:", messages.length, "messages");
    } else {
      console.log("❌ Message retrieval failed:", getResponse.status);
    }
    
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

// Run the test
testMessaging();
