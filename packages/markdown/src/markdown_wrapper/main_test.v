module main

struct Filenames {
	path_with_extension    string
	path_without_extension string
}

fn get_filenames() Filenames {
	filename := '/wareme/packages/markdown/src/markdown_wrapper/some_file.md'
	extension_index := filename.index('.md') or { panic(err) }
	filename_without_extension := filename[..extension_index]

	return Filenames{
		path_with_extension: filename
		path_without_extension: filename_without_extension
	}
}

fn test_change_file_extension() {
	filenames := get_filenames()
	updated_filename := change_file_extension(filenames.path_with_extension, '.md', '.html') or {
		panic(err)
	}
	html_index := updated_filename.index('.html') or { panic(err) }
	fail_to_update := change_file_extension(filenames.path_without_extension, '.md', '.html') or {
		''
	}
	assert fail_to_update == ''
}

fn test_get_output_filename() {
	filenames := get_filenames()
	updated_filename := get_output_filename(filenames.path_with_extension)
	updated_filename_html_index := updated_filename.index('.html') or { -1 }
	assert updated_filename_html_index != -1

	updated_filename_without_extension := get_output_filename(filenames.path_without_extension)
	updated_filename_without_extension_html_index := updated_filename_without_extension.index('.html') or {
		-1
	}
	assert updated_filename_without_extension_html_index != -1
}
