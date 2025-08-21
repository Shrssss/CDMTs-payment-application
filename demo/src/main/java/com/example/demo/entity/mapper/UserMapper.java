package com.example.demo.entity.mapper;

import org.apache.ibatis.annotations.Mapper;
import com.example.demo.entity.UserTable;
import java.util.List;
@Mapper
public interface UserMapper {
	/** ユーザIDでSELECT */
	public List<UserTable>selectById(long userId);
	/** INSERT(登録件数を返す) */
	public int insert(UserTable userTable);
}
