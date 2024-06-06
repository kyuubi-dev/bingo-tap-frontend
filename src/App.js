import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Tap from './Pages/Tap';
import BgImage from './Pages/BgImage';
import Team from './Pages/Team';
import Navigation from './Pages/Navigation';
import Task from './Pages/Task';
import Boost from './Pages/Boost';
import Stat from './Pages/Stat';
function App() {
  const [userBalance, setUserBalance] = useState(0);
  document.addEventListener('gesturestart', function (e) {
    e.preventDefault();
});
  return (
    <div className="App">
      <BgImage/>
      <BrowserRouter>
        <Navigation />
        <Routes>
          
          <Route path="/" element={<Tap setUserBalance={setUserBalance} />} />
          <Route path="/team" element={<Team />} />
          <Route path="/task" element={<Task userBalance={userBalance} />} />
          <Route path="/boost" element={<Boost />} />
          <Route path='/stat' element={<Stat/>}/>
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
