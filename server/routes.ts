import React, { useState, useEffect } from 'react';

function Profile() {
  const [data, setData] = useState(null);
  const [role, setRole] = useState('');

  useEffect(() => {
    fetch('/api/profile')
      .then(res => res.json())
      .then(info => {
        setData(info);
        setRole('user');
      });
  }, []);

  return (
    <div>
      {data ? (
        <>
          <h1>{data.name}'s Profile</h1>
          <p>Role: {role}</p>
        </>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
}

export default Profile;
</replit_final_file>