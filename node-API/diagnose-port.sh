#!/bin/bash
# Port diagnostics script

PORT=${1:-3000}  # Default to port 3000 if not specified
echo "========== PORT $PORT DIAGNOSTICS =========="

# Check if anything is using the port
echo -e "\n1. Checking if port $PORT is in use:"
if command -v lsof &> /dev/null; then
  PORT_INFO=$(lsof -i :$PORT -n)
  if [ -z "$PORT_INFO" ]; then
    echo "✓ Port $PORT is not in use by any process (according to lsof)"
  else
    echo "⚠ Port $PORT is in use:"
    echo "$PORT_INFO"
    PID=$(lsof -i :$PORT -t)
    if [ ! -z "$PID" ]; then
      echo -e "\nProcess details:"
      ps -p $PID -o pid,ppid,user,cmd
    fi
  fi
else
  PORT_INFO=$(netstat -tuln | grep ":$PORT ")
  if [ -z "$PORT_INFO" ]; then
    echo "✓ Port $PORT is not in use by any process (according to netstat)"
  else
    echo "⚠ Port $PORT is in use:"
    echo "$PORT_INFO"
  fi
fi

# Check if the port is in TIME_WAIT state
echo -e "\n2. Checking for TIME_WAIT status on port $PORT:"
TIME_WAIT=$(netstat -anp | grep ":$PORT " | grep "TIME_WAIT")
if [ ! -z "$TIME_WAIT" ]; then
  echo "⚠ Port $PORT has sockets in TIME_WAIT state:"
  echo "$TIME_WAIT"
  echo -e "\nThis might prevent binding to the port immediately after a process exit."
else
  echo "✓ No TIME_WAIT sockets found for port $PORT"
fi

# Check if the port is listening but not showing up with lsof/netstat
echo -e "\n3. Testing if port can be connected to:"
timeout 1 bash -c "echo > /dev/tcp/localhost/$PORT" 2>/dev/null
if [ $? -eq 0 ]; then
  echo "⚠ Port $PORT accepted a connection, but might not be shown in lsof/netstat"
else
  echo "✓ Port $PORT is not accepting connections"
fi

echo -e "\n4. Testing if server can bind to port $PORT:"
node -e "
const net = require('net');
const server = net.createServer();

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log('⚠ Port $PORT is in use and cannot be bound');
    process.exit(1);
  } else {
    console.log('Error binding to port:', err);
    process.exit(2);
  }
});

server.listen($PORT, () => {
  console.log('✓ Successfully bound to port $PORT');
  server.close();
});
"

echo -e "\n========== DIAGNOSTICS COMPLETE =========="
echo "If you're still having issues, try one of these solutions:"
echo "1. Restart your server with: npm run start:clean"
echo "2. Use an alternative port: npm run start:alt"
echo "3. Manually kill processes: kill -9 \$(lsof -t -i:$PORT)"
echo "4. Reboot your system as a last resort"
