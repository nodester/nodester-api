{exec} = require 'child_process'
task 'build', 'Build project from src to lib', ->
  exec 'coffee --compile --output lib/ src/', (err, stdout, stderr) ->
    throw err if err
    console.log stdout if stdout
    console.log stderr if stderr
    console.log 'Build completed!'
