require 'rake'

desc "Compile CSS files"
task :css do
  puts "Merging CSS"
  `cat static/css/style.css > static/css/temp.css`
  `cat static/css/custom.css >> static/css/temp.css`
  `cat static/css/syntax.css >> static/css/temp.css`
  puts "Compressing CSS"
  `yuicompressor static/css/temp.css > static/css/main.css`
  `rm static/css/temp.css`
end

desc "Deploy site"
task :deploy do
  Rake::Task['css'].execute

  puts "Pushing to Github"
  `git push origin master`
end

task "Serve"
task :serve do
  Rake::Task['css'].execute

  `open http://localhost:4000`
  `jekyll --serve --no-pygments`
end
