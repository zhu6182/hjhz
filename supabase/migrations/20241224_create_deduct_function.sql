
create or replace function deduct_credits(p_user_id uuid)
returns int
language plpgsql
security definer -- Run as creator (admin) to ensure permissions, though not strictly needed if RLS disabled
as $$
declare
  current_credits int;
  new_credits int;
begin
  -- Check and lock row
  select credits into current_credits
  from app_users
  where id = p_user_id
  for update;

  if not found then
    raise exception 'User not found';
  end if;

  if current_credits < 1 then
    raise exception 'Insufficient credits';
  end if;

  new_credits := current_credits - 1;

  update app_users
  set credits = new_credits
  where id = p_user_id;

  return new_credits;
end;
$$;
