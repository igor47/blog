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
