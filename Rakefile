require 'rake'

desc "Compile CSS files"
task :css do
  puts "Deleting old style.css.."
  `rm static/css/style.css`
  puts "Populating style.css.."
  `cat static/css/base.css > static/css/style.css`
  `cat static/css/specific.css >> static/css/style.css`
  puts "Done!"
end
