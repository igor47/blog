require 'rake'

desc "Compile CSS files"
task :css do
  puts "Merging CSS"
  Dir["./static/css/*.css"].each do |file|
    `cat #{file} >> ./static/css/temp.css`
  end

  puts "Compressing CSS"
  `yuicompressor static/css/temp.css > static/css/style.css`
  puts 'CSS dumped to ./static/css/style.css'
  `rm static/css/temp.css`
end

desc "Deploy site"
task :deploy do
  Rake::Task['css'].execute
  puts 'Comitting generated CSS'
  `git add static/css/style.css`
  `git commit -m 'Compressed CSS for deploy'`

  puts "Pushing to Github"
  `git push origin master`
end

task "Serve"
task :serve do
  Rake::Task['css'].execute

  `open http://localhost:4000`
  `jekyll --serve --no-pygments`
end
