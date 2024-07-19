module main

import os
import json
import coachonko.luuid

fn handle_args(args []string) !string {
	len := args.len
	for i := 0; i < len; i++ {
		arg := args[i]
		if arg == '--v2' {
			res := luuid.v2()!
			return res
		}

		if arg.starts_with('--parse=') {
			id := arg['--parse='.len..]
			parsed := luuid.parse(id)!
			return json.encode(parsed)
		}

		if arg.starts_with('--add_hyphens=') {
			id := arg['--add_hyphens='.len..]
			res := luuid.add_hyphens(id)!
			return res
		}

		if arg.starts_with('--remove_hyphens=') {
			id := arg['--remove_hyphens='.len..]
			res := luuid.remove_hyphens(id)
			return res
		}
	}

	return error('invalid args')
}

// commands end with `\n`
// The program accepts the following arguments.
// `--v2`: a luuid v2 is returned, then exits immediately.
// `--parse=<LUUID>`: parses a luuid and returns the data in json format, then exits immediately.
// `--add_hyphens=<LUUID>`: returns the provided luuid with added hyphens, then exits immediately.
// Only one argument is accepted at any one time
fn main() {
	args := os.args
	if args.len > 1 {
		res := handle_args(args) or {
			println(err.msg())
			return
		}
		println(res)
		return
	}

	mut generator := luuid.new_generator()
	for { // break loop when parent closes
		line := os.input('')

		if line == '<EOF>' { // https://github.com/vlang/v/blob/master/vlib/os/os.v#L342C40-L342C45
			break
		}

		if line == 'v1' {
			id := generator.v1() or { 'error' } // TODO handle error
			println(id)
		}
	}
}
