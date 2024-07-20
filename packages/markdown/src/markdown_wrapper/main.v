module main

import os
import markdown

fn change_file_extension(filename string, from string, to string) !string {
	error_message := 'filename does not end with the expected extension'
	index := filename.last_index(from) or { return error(error_message) }

	if index == filename.len - from.len {
		new_filename := '${filename[..index]}${to}'
		return new_filename
	}

	return error(error_message)
}

fn get_output_filename(output_path string) string {
	output_filename := change_file_extension(output_path, '.md', '.html') or {
		'${output_path}.html'
	}
	return output_filename
}

fn get_output_path_from_args(args []string) !string {
	if args.len < 3 {
		return error('no output path provided')
	}

	for i := 0; i < args.len; i++ {
		arg := args[i]
		if arg.starts_with('--out=') {
			path := arg['--out='.len..]
			return path
		}
	}
	return error('no output path provided')
}

fn main() {
	args := os.args
	if args.len < 2 {
		eprintln('invalid args')
		return
	}

	input_path := args[1]
	input_data := os.read_file(input_path) or {
		eprintln(err)
		return
	}

	res := markdown.to_html(input_data)
	output_path := get_output_path_from_args(args) or { input_path }
	output_filename := get_output_filename(output_path)
	os.write_file(output_filename, res) or {
		eprintln('failed to output file ${output_filename}')
		return
	}

	println(output_filename)
	return
}
