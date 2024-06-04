import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Tap from './Pages/Home/Tap';
import Team from './Pages/Team/Team';
import Navigation from './Pages/Navigation';
import Task from './Pages/Task/Task';

function App() {
  const [userBalance, setUserBalance] = useState(0);

  return (
    <div className="App">
      <BrowserRouter>
        <Navigation />
        <Routes>
          <Route path="/" element={<Tap setUserBalance={setUserBalance} />} />
          <Route path="/team" element={<Team />} />
          <Route path="/task" element={<Task userBalance={userBalance} />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
