
// exercise 4.53
process_query('supervisor($x, list("Bitdiddle", "Ben"))');

process_query('job($x, pair("accounting", $y))');

process_query('address($x, pair("Slumerville", $y))');

// exercise 4.54
process_query(`and(
    supervisor($name, list("Bitdiddle", "Ben")),
    address($name, $any)
    )`);

process_query(`
  and(
    salary(list("Bitdiddle", "Ben"), $Ben_salary),
    and(
      salary($any_one, $any_salary),
      javascript_predicate($Ben_salary > $any_salary))
  )
`);

process_query(`
  and(
      supervisor($any_one, $boss),
      not(
        job($boss, pair("computer", $x))),
    job($boss, $y))
`);

process_query(`assert(rule(same($x, $x)))`);

process_query(`assert(rule(replace($person_1, $person_2),
    and(
      job($person_1, $job_person_1),
      job($person_2, $job_person_2),
      not(same($person_1, $person_2)),
      or(
        same($job_person_1, $job_person_2)
        can_do_job($job_person_1, $job_person_2)))))`);

process_query(`replace($x, list("Fect", "Cy", "D"))`);

process_query(`and(
  replace($who, $replaced),
  salary($replaced, $replaced_salary),
  salary($who, $who_salary),
  javascript_predicate($replaced_salary > $who_salary))`);

process_query(`
  and(
    salary($p_1, $j_1),
    salary($p_2, $j_1),
    not(same($p_1, $p_2)))
`);

process_query(`assert(rule(
  big_shot($big_shot),
  and(
    supervisor($big_shot, $boss),
    job($big_shot, pair($division_big_shot, $any_1)),
    job($boss, pair($division_boss, $any_2)),
    not(same($division_big_shot, $division_boss))
  )))`);
process_query('big_shot($x)');

// exercise 4.57
meeting($x, pair('Friday', $any));

rule(meeting_time($person, $day_and_time),
  or(
    and(
      job($person, pair($division, $any_division_part)),
      meeting($division, $day_and_time)),
    meeting('whole-company', $day_and_time)))

meeting_time(list('Hacker', 'Alyssa', 'P'), pair('Wednesday', $any_time));

// exercise 4.58
// TO FIX
process_query(`assert(rule(same($x, $x)))`);
process_query(`assert(
  rule(lives_near($person_1, $person_2),
       and(address($person_1, pair($town, $rest_1)),
           address($person_2, pair($town, $rest_2)),
           not(same($person_1, $person_2)),
           same(pair($name_1, $any_1), $person_1),
           same(pair($name_2, $any_2), $person_2),
           javascript_predicate($name_1 > $name_2)
           ))
)`);
process_query(`lives_near($x, $y)`);
  
// exercise 4.59
process_query(`assert(rule(next_to_in($x, $y, pair($x, pair($y, $u)))))`);

process_query(`assert(rule(next_to_in($x, $y, pair($v, $z)),
     next_to_in($x, $y, $z)))`);

process_query(`next_to_in($x, 1, list(2, 1, 3, 1))`);

process_query(`next_to_in($x, $y, list(1, list(2, 3), 4))`);

// exercise 4.60
process_query(`assert(
  rule(last_pair($x, $x))
  )`);

process_query(`assert(
    rule(last_pair(pair($f, $r), $x),
        last_pair($r, $x))
)`);

process_query(`assert(rule(append_to_form(null, $y, $y)))`);

process_query(`assert(
  rule(append_to_form(pair($u, $v), $y, pair($u, $z)),
      append_to_form($v, $y, $z)
  )
  )`);

process_query(`asserts( 
  rule(reverse(pair($x, null), pair($x, null)))
)`)

process_query(`assert(
  rule(reverse(pair($f, $r), $z),
    and(
      append_to_form(reverse($r, $any), $f, $a),
      reverse(pair($f, $r), $a)
  ))
)`)

process_query(`reverse(list(1, 2, 3), $x)`)
